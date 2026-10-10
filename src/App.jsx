import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  Database,
  LineChart,
  Lock,
  LogOut,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Square,
  TrendingUp,
  Zap
} from 'lucide-react';
import { api, clearSession, getStoredSession, login } from './api.js';
import { createRealtimeClient, realtimeTopics } from './realtime.js';
import { featureCoverage, tradingPipeline, workflows } from './workflows.js';

const profiles = ['INTRADAY', 'SWING', 'POSITIONAL'];
const timeframes = ['1m', '5m', '15m', '30m', '1h', '1d'];

function asList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return 'Unavailable';
  if (typeof value === 'number') return Number.isInteger(value) ? value : value.toFixed(2);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function pick(row, key) {
  return row && row[key] !== undefined ? row[key] : undefined;
}

function App() {
  const [session, setSession] = useState(getStoredSession);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState('system');
  const [symbol, setSymbol] = useState('RELIANCE');
  const [timeframe, setTimeframe] = useState('1d');
  const [profile, setProfile] = useState('SWING');
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState('DISCONNECTED');
  const [realtimeEvents, setRealtimeEvents] = useState([]);
  const [realtimeClient, setRealtimeClient] = useState(null);
  const [backtestForm, setBacktestForm] = useState({
    strategyName: 'RSI MACD Swing',
    initialCapital: 100000,
    commissionPercent: 0.03,
    slippagePercent: 0.05,
    riskPerTradePercent: 1,
    stopLossPercent: 1.5,
    takeProfitPercent: 3
  });
  const [manualOrder, setManualOrder] = useState({
    side: 'BUY',
    orderType: 'LIMIT',
    quantity: 1,
    entryPrice: 1000,
    stopLoss: 985,
    target: 1030
  });

  const currentWorkflow = workflows.find((item) => item.id === activeWorkflow) || workflows[0];
  const summaryCards = useMemo(() => {
    const health = data.health || {};
    const status = data.systemStatus || {};
    const portfolio = data.portfolio || {};
    const risk = data.risk || {};

    return [
      { label: 'Backend', value: health.status || 'Unknown', detail: health.tradingMode || 'Mode unavailable', icon: Activity },
      { label: 'Kill Switch', value: status.killSwitchActive ? 'Active' : 'Clear', detail: status.status || 'System status', icon: ShieldCheck },
      { label: 'Capital', value: portfolio.availableCapital || portfolio.availableCash || 'Unavailable', detail: portfolio.currency || 'Portfolio', icon: Database },
      { label: 'Risk Limit', value: risk.maxDailyLossPercent ? `${risk.maxDailyLossPercent}%` : 'Unavailable', detail: 'Max daily loss', icon: AlertTriangle }
    ];
  }, [data]);

  async function runTask(key, task, successMessage) {
    setErrors((current) => ({ ...current, [key]: '' }));
    setNotice('');
    try {
      const result = await task();
      setData((current) => ({ ...current, [key]: result }));
      if (successMessage) setNotice(successMessage);
      return result;
    } catch (error) {
      setErrors((current) => ({ ...current, [key]: error.message }));
      return null;
    }
  }

  async function loadCommandCenter() {
    await Promise.all([
      runTask('health', api.health),
      runTask('systemStatus', api.systemStatus),
      runTask('marketStatus', api.marketStatus),
      runTask('portfolio', api.portfolio),
      runTask('risk', api.risk),
      runTask('performance', api.performance)
    ]);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      const nextSession = await login(username, password);
      setSession(nextSession);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    if (realtimeClient) realtimeClient.deactivate();
    clearSession();
    setSession(null);
    setData({});
    setRealtimeClient(null);
    setRealtimeStatus('DISCONNECTED');
  }

  useEffect(() => {
    if (session) loadCommandCenter();
  }, [session]);

  async function loadMarketWorkflow() {
    await Promise.all([
      runTask('quote', () => api.quote(symbol)),
      runTask('candles', () => api.candles(symbol, timeframe)),
      runTask('indicators', () => api.indicators(symbol, timeframe)),
      runTask('stocks', api.stocks),
      runTask('sectors', api.sectors),
      runTask('screener', () => api.screener(profile)),
      runTask('rankings', () => api.rankings(profile)),
      runTask('signals', () => api.signals(profile)),
      runTask('criteria', () => api.screeningCriteria(profile))
    ]);
  }

  async function loadDecisionWorkflow() {
    await Promise.all([
      runTask('aiDecisions', api.aiDecisions),
      runTask('models', api.models),
      runTask('modelsAlias', api.modelsAlias),
      runTask('probabilityThreshold', api.probabilityThreshold)
    ]);
  }

  async function loadExecutionWorkflow() {
    await Promise.all([
      runTask('portfolio', api.portfolio),
      runTask('positions', api.positions),
      runTask('orders', api.orders),
      runTask('trades', api.trades),
      runTask('riskEvents', api.riskEvents)
    ]);
  }

  async function loadLearningWorkflow() {
    await Promise.all([
      runTask('learningDaily', api.learningDaily),
      runTask('mistakes', api.mistakes),
      runTask('adaptations', api.adaptations),
      runTask('weeklyPerformance', api.weeklyPerformance),
      runTask('monthlyPerformance', api.monthlyPerformance)
    ]);
  }

  function connectRealtime() {
    if (realtimeClient?.active) return;
    const client = createRealtimeClient(
      (event) => setRealtimeEvents((current) => [event, ...current].slice(0, 50)),
      setRealtimeStatus
    );
    setRealtimeClient(client);
    setRealtimeStatus('CONNECTING');
    client.activate();
  }

  function disconnectRealtime() {
    if (realtimeClient) realtimeClient.deactivate();
    setRealtimeStatus('DISCONNECTED');
  }

  async function cancelOrder(id) {
    if (!id || !window.confirm('Cancel this order?')) return;
    await runTask('cancelOrder', () => api.cancelOrder(id), 'Order cancellation requested');
    await runTask('orders', api.orders);
  }

  async function placeManualOrder() {
    await runTask('manualOrderResponse', () => api.placeOrder({
      ...manualOrder,
      symbol,
      quantity: String(manualOrder.quantity),
      entryPrice: String(manualOrder.entryPrice),
      stopLoss: String(manualOrder.stopLoss),
      target: String(manualOrder.target)
    }), 'Manual order submitted to backend risk pipeline');
    await runTask('orders', api.orders);
    await runTask('portfolio', api.portfolio);
  }

  async function triggerAnalysis() {
    await runTask('symbolAnalysis', () => api.analyzeSymbol(symbol), `AI analysis requested for ${symbol}`);
  }

  async function runBacktest() {
    const candles = data.candles || await runTask('candles', () => api.candles(symbol, timeframe));
    const payload = {
      ...backtestForm,
      symbol,
      timeframe,
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      initialCapital: String(backtestForm.initialCapital),
      candles: asList(candles)
    };
    await runTask('backtest', () => api.backtest(payload), 'Backtest completed');
  }

  async function systemAction(key, action, message, dangerous = false) {
    if (dangerous && !window.confirm(message)) return;
    await runTask(key, action, message);
    await loadCommandCenter();
  }

  if (!session) {
    return (
      <main className="login-screen">
        <section className="login-panel">
          <div className="brand-mark">
            <TrendingUp size={32} />
            <span>SmartTrader</span>
          </div>
          <h1>Connect to the backend console</h1>
          <p>Use a backend account to unlock trading workflows, risk controls, market intelligence, and learning reports.</p>
          <form onSubmit={handleLogin}>
            <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></label>
            <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" /></label>
            {authError && <div className="error-text">{authError}</div>}
            <button type="submit" disabled={loading}><Lock size={18} />{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>
          <small>API base: {api.baseUrl}</small>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><TrendingUp size={28} /><span>SmartTrader</span></div>
        <nav className="nav-list" aria-label="Workflow navigation">
          {workflows.map((workflow) => (
            <button className={activeWorkflow === workflow.id ? 'active' : ''} key={workflow.id} onClick={() => setActiveWorkflow(workflow.id)} type="button">
              {workflow.id === 'system' && <ShieldCheck size={18} />}
              {workflow.id === 'market' && <LineChart size={18} />}
              {workflow.id === 'decision' && <Brain size={18} />}
              {workflow.id === 'execution' && <Zap size={18} />}
              {workflow.id === 'realtime' && <Activity size={18} />}
              {workflow.id === 'coverage' && <Database size={18} />}
              {workflow.id === 'learning' && <BarChart3 size={18} />}
              {workflow.id === 'backtest' && <Activity size={18} />}
              <span>{workflow.title}</span>
            </button>
          ))}
        </nav>
        <button className="logout" type="button" onClick={logout}><LogOut size={18} />Sign out</button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Autonomous Trading Operations</p>
            <h1>{currentWorkflow.title}</h1>
            <p>{currentWorkflow.purpose}</p>
          </div>
          <button type="button" onClick={loadCommandCenter}><RefreshCw size={18} />Refresh</button>
        </header>

        {notice && <div className="notice"><CheckCircle2 size={18} /> {notice}</div>}

        <section className="summary-grid">
          {summaryCards.map((card) => (
            <article className="metric-card" key={card.label}>
              <card.icon size={20} />
              <span>{card.label}</span>
              <strong>{formatValue(card.value)}</strong>
              <em>{formatValue(card.detail)}</em>
            </article>
          ))}
        </section>

        <section className="pipeline" aria-label="Trading pipeline">
          {tradingPipeline.map((step, index) => <span key={step}>{index + 1}. {step}</span>)}
        </section>

        {activeWorkflow === 'system' && (
          <WorkflowSection title="System and Safety" actions={[
            ['Health', () => runTask('health', api.health)],
            ['System Status', () => runTask('systemStatus', api.systemStatus)],
            ['Market Status', () => runTask('marketStatus', api.marketStatus)],
            ['Start Paper', () => systemAction('startPaper', api.startPaper, 'Paper trading started')],
            ['Stop Paper', () => systemAction('stopPaper', api.stopPaper, 'Paper trading stopped')],
            ['Stop Live', () => systemAction('stopLive', api.stopLive, 'Stop live trading?', true)],
            ['Start Live', () => systemAction('startLive', api.startLive, 'Start live trading?', true)],
            ['Kill Switch', () => systemAction('killSwitch', () => api.killSwitch('Frontend operator action'), 'Activate kill switch?', true)]
          ]}>
            <KeyValue title="Health" value={data.health} error={errors.health} />
            <KeyValue title="System" value={data.systemStatus} error={errors.systemStatus} />
            <KeyValue title="Market" value={data.marketStatus} error={errors.marketStatus} />
          </WorkflowSection>
        )}

        {activeWorkflow === 'market' && (
          <WorkflowSection title="Market Data and Screening" actions={[
            ['Load Market Workflow', loadMarketWorkflow],
            ['Quote', () => runTask('quote', () => api.quote(symbol))],
            ['Indicators', () => runTask('indicators', () => api.indicators(symbol, timeframe))],
            ['Screener', () => runTask('screener', () => api.screener(profile))],
            ['Rankings', () => runTask('rankings', () => api.rankings(profile))],
            ['Signals', () => runTask('signals', () => api.signals(profile))]
          ]}>
            <Controls symbol={symbol} setSymbol={setSymbol} timeframe={timeframe} setTimeframe={setTimeframe} profile={profile} setProfile={setProfile} />
            <KeyValue title="Quote" value={data.quote} error={errors.quote} />
            <KeyValue title="Indicators" value={data.indicators} error={errors.indicators} />
            <DataTable title="Screener" rows={data.screener} error={errors.screener} columns={['symbol', 'score', 'reason', 'profile']} />
            <DataTable title="Rankings" rows={data.rankings} error={errors.rankings} columns={['symbol', 'profile', 'totalScore', 'liquidityScore', 'fundamentalScore', 'calculatedAt']} />
            <DataTable title="Signals" rows={data.signals} error={errors.signals} columns={['symbol', 'profile', 'signal', 'score', 'reason', 'generatedAt']} />
            <DataTable title="Stocks" rows={data.stocks} error={errors.stocks} columns={['symbol', 'exchange', 'companyName', 'sector', 'status']} />
            <KeyValue title="Sectors" value={data.sectors} error={errors.sectors} />
            <KeyValue title="Criteria" value={data.criteria} error={errors.criteria} />
          </WorkflowSection>
        )}

        {activeWorkflow === 'decision' && (
          <WorkflowSection title="AI and ML" actions={[
            ['Load Decision Workflow', loadDecisionWorkflow],
            ['Analyze Symbol', triggerAnalysis],
            ['AI Decisions', () => runTask('aiDecisions', api.aiDecisions)],
            ['ML Models', () => runTask('models', api.models)]
          ]}>
            <Controls symbol={symbol} setSymbol={setSymbol} timeframe={timeframe} setTimeframe={setTimeframe} profile={profile} setProfile={setProfile} compact />
            <KeyValue title="Latest Symbol Analysis" value={data.symbolAnalysis} error={errors.symbolAnalysis} />
            <DataTable title="AI Decisions" rows={data.aiDecisions} error={errors.aiDecisions} columns={['symbol', 'action', 'confidence', 'reasoningSummary', 'createdAt']} />
            <DataTable title="ML Models" rows={data.models} error={errors.models} columns={['name', 'version', 'featureVersion', 'deployed']} />
            <DataTable title="Models Alias" rows={data.modelsAlias} error={errors.modelsAlias} columns={['name', 'version', 'featureVersion', 'deployed']} />
            <KeyValue title="ML Probability Threshold" value={data.probabilityThreshold} error={errors.probabilityThreshold} />
          </WorkflowSection>
        )}

        {activeWorkflow === 'execution' && (
          <WorkflowSection title="Portfolio, Orders, Risk" actions={[
            ['Load Execution Workflow', loadExecutionWorkflow],
            ['Portfolio', () => runTask('portfolio', api.portfolio)],
            ['Orders', () => runTask('orders', api.orders)],
            ['Positions', () => runTask('positions', api.positions)],
            ['Risk Events', () => runTask('riskEvents', api.riskEvents)]
          ]}>
            <KeyValue title="Portfolio" value={data.portfolio} error={errors.portfolio} />
            <KeyValue title="Risk Parameters" value={data.risk} error={errors.risk} />
            <ManualOrderForm form={manualOrder} setForm={setManualOrder} onSubmit={placeManualOrder} response={data.manualOrderResponse} error={errors.manualOrderResponse} />
            <DataTable title="Open Positions" rows={data.positions} error={errors.positions} columns={['symbol', 'quantity', 'averagePrice', 'currentPrice', 'unrealizedPnl', 'status']} />
            <DataTable title="Orders" rows={data.orders} error={errors.orders} columns={['symbol', 'side', 'quantity', 'status', 'clientOrderId', 'createdAt']} />
            <OrderActions orders={data.orders} onCancel={cancelOrder} />
            <DataTable title="Completed Trades" rows={data.trades} error={errors.trades} columns={['symbol', 'side', 'quantity', 'entryPrice', 'exitPrice', 'pnl']} />
            <DataTable title="Rejected Risk Events" rows={data.riskEvents} error={errors.riskEvents} columns={['symbol', 'decision', 'reason', 'occurredAt']} />
          </WorkflowSection>
        )}

        {activeWorkflow === 'realtime' && (
          <WorkflowSection title="Realtime Event Stream" actions={[
            ['Connect', connectRealtime],
            ['Disconnect', disconnectRealtime],
            ['Clear Events', () => setRealtimeEvents([])]
          ]}>
            <KeyValue title="Realtime Status" value={{ status: realtimeStatus, endpoint: `${api.baseUrl}/ws`, subscribedTopics: realtimeTopics.length }} />
            <KeyValue title="Subscribed Topics" value={realtimeTopics} />
            <DataTable title="Events" rows={realtimeEvents} columns={['topic', 'eventType', 'symbol', 'payload', 'timestamp']} />
          </WorkflowSection>
        )}

        {activeWorkflow === 'coverage' && (
          <WorkflowSection title="Required Feature Coverage" actions={[
            ['Refresh Core APIs', loadCommandCenter],
            ['Check Market APIs', loadMarketWorkflow],
            ['Check Decision APIs', loadDecisionWorkflow],
            ['Check Execution APIs', loadExecutionWorkflow],
            ['Check Learning APIs', loadLearningWorkflow]
          ]}>
            <DataTable title="Feature Matrix" rows={featureCoverage.map(([feature, apiSurface, status]) => ({ feature, apiSurface, status }))} columns={['feature', 'apiSurface', 'status']} />
            <KeyValue title="Coverage Note" value={{
              implemented: 'The frontend includes every REST and WebSocket capability currently exposed by the backend controllers.',
              backendGap: 'The previously missing rankings, signals, models alias, and manual order APIs are now exposed by the backend.',
              safety: 'Broker secrets and direct database access are intentionally absent from the frontend.'
            }} />
          </WorkflowSection>
        )}

        {activeWorkflow === 'learning' && (
          <WorkflowSection title="Performance and Adaptation" actions={[
            ['Load Learning Workflow', loadLearningWorkflow],
            ['Daily Learning', () => runTask('learningDaily', api.learningDaily)],
            ['Mistakes', () => runTask('mistakes', api.mistakes)],
            ['Adaptations', () => runTask('adaptations', api.adaptations)]
          ]}>
            <KeyValue title="Today Performance" value={data.performance} error={errors.performance} />
            <KeyValue title="Weekly Performance" value={data.weeklyPerformance} error={errors.weeklyPerformance} />
            <KeyValue title="Monthly Performance" value={data.monthlyPerformance} error={errors.monthlyPerformance} />
            <KeyValue title="Daily Learning" value={data.learningDaily} error={errors.learningDaily} />
            <DataTable title="Mistakes" rows={data.mistakes} error={errors.mistakes} columns={['mistakeType', 'severity', 'financialImpact', 'detectedAt']} />
            <DataTable title="Adaptations" rows={data.adaptations} error={errors.adaptations} columns={['status', 'parameterName', 'oldValue', 'newValue', 'reason']} />
          </WorkflowSection>
        )}

        {activeWorkflow === 'backtest' && (
          <WorkflowSection title="Backtest Runner" actions={[
            ['Fetch Candles', () => runTask('candles', () => api.candles(symbol, timeframe))],
            ['Run Backtest', runBacktest]
          ]}>
            <Controls symbol={symbol} setSymbol={setSymbol} timeframe={timeframe} setTimeframe={setTimeframe} profile={profile} setProfile={setProfile} compact />
            <BacktestForm form={backtestForm} setForm={setBacktestForm} />
            <KeyValue title="Backtest Result" value={data.backtest} error={errors.backtest} />
            <DataTable title="Candles Supplied" rows={data.candles} error={errors.candles} columns={['timestamp', 'open', 'high', 'low', 'close', 'volume']} />
          </WorkflowSection>
        )}
      </section>
    </main>
  );
}

function WorkflowSection({ title, actions, children }) {
  return (
    <section className="workflow">
      <div className="section-heading">
        <h2>{title}</h2>
        <div className="action-row">
          {actions.map(([label, action]) => (
            <button key={label} type="button" onClick={action}>
              {label.includes('Stop') ? <Square size={16} /> : label.includes('Load') ? <RefreshCw size={16} /> : <Play size={16} />}
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="panel-grid">{children}</div>
    </section>
  );
}

function Controls({ symbol, setSymbol, timeframe, setTimeframe, profile, setProfile, compact }) {
  return (
    <article className={compact ? 'panel compact-panel' : 'panel controls-panel'}>
      <div className="panel-title"><Search size={18} /><h3>Inputs</h3></div>
      <div className="control-grid">
        <label>Symbol<input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} /></label>
        <label>Timeframe<select value={timeframe} onChange={(event) => setTimeframe(event.target.value)}>{timeframes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Profile<select value={profile} onChange={(event) => setProfile(event.target.value)}>{profiles.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
    </article>
  );
}

function BacktestForm({ form, setForm }) {
  const fields = [
    ['strategyName', 'Strategy'],
    ['initialCapital', 'Capital'],
    ['commissionPercent', 'Commission %'],
    ['slippagePercent', 'Slippage %'],
    ['riskPerTradePercent', 'Risk %'],
    ['stopLossPercent', 'Stop %'],
    ['takeProfitPercent', 'Target %']
  ];

  return (
    <article className="panel wide-panel">
      <div className="panel-title"><Activity size={18} /><h3>Simulation Settings</h3></div>
      <div className="control-grid multi">
        {fields.map(([key, label]) => (
          <label key={key}>{label}<input value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} /></label>
        ))}
      </div>
    </article>
  );
}

function OrderActions({ orders, onCancel }) {
  const cancellable = asList(orders).filter((order) => order?.id && !['CANCELLED', 'FILLED', 'REJECTED', 'EXITED'].includes(order.status));
  return (
    <article className="panel wide-panel">
      <div className="panel-title"><Zap size={18} /><h3>Order Actions</h3><span>{cancellable.length}</span></div>
      {cancellable.length === 0 && <p className="empty">No cancellable orders available.</p>}
      {cancellable.length > 0 && (
        <div className="order-actions">
          {cancellable.map((order) => (
            <button key={order.id} type="button" onClick={() => onCancel(order.id)}>
              <Square size={16} />
              Cancel {order.symbol || order.clientOrderId || order.id}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function KeyValue({ title, value, error }) {
  const entries = value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value).slice(0, 16) : [['value', value]];
  return (
    <article className="panel">
      <div className="panel-title"><Database size={18} /><h3>{title}</h3></div>
      {error && <div className="error-text">{error}</div>}
      {!error && !value && <p className="empty">No data loaded.</p>}
      {!error && value && (
        <dl className="kv-list">
          {entries.map(([key, item]) => <div key={key}><dt>{key}</dt><dd>{formatValue(item)}</dd></div>)}
        </dl>
      )}
    </article>
  );
}

function DataTable({ title, rows, error, columns }) {
  const items = asList(rows).slice(0, 20);
  return (
    <article className="panel wide-panel">
      <div className="panel-title"><BarChart3 size={18} /><h3>{title}</h3><span>{items.length}</span></div>
      {error && <div className="error-text">{error}</div>}
      {!error && items.length === 0 && <p className="empty">No rows available.</p>}
      {!error && items.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {items.map((row, index) => (
                <tr key={row.id || row.clientOrderId || index}>
                  {columns.map((column) => <td key={column}>{formatValue(pick(row, column))}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

export default App;
