export const workflows = [
  { id: 'system', title: 'System Control', purpose: 'Check health, trading mode, market status, and emergency state before any workflow.' },
  { id: 'market', title: 'Market Intelligence', purpose: 'Inspect quotes, candles, indicators, stock universe, sectors, and screener output.' },
  { id: 'decision', title: 'AI and ML Decisions', purpose: 'Review AI decisions, trigger symbol analysis, and inspect deployed model settings.' },
  { id: 'execution', title: 'Execution Desk', purpose: 'Track portfolio, open positions, orders, cancellations, completed trades, and risk events.' },
  { id: 'realtime', title: 'Realtime Events', purpose: 'Subscribe to backend WebSocket topics for quotes, signals, AI decisions, orders, risk alerts, and system events.' },
  { id: 'coverage', title: 'Feature Coverage', purpose: 'Check every required workflow against the REST and WebSocket APIs available in the backend.' },
  { id: 'learning', title: 'Learning Loop', purpose: 'Review daily learning, mistakes, adaptations, and performance metrics after trades settle.' },
  { id: 'backtest', title: 'Backtesting', purpose: 'Replay historical candles through the backend backtest engine before strategy changes.' }
];

export const tradingPipeline = [
  'Health',
  'Market Data',
  'Indicators',
  'Screening',
  'ML',
  'AI Review',
  'Risk Engine',
  'Orders',
  'Positions',
  'Learning'
];

export const featureCoverage = [
  ['Authentication', 'POST /api/auth/login', 'Implemented'],
  ['Health and mode', 'GET /api/health', 'Implemented'],
  ['System status', 'GET /api/system/status', 'Implemented'],
  ['Kill switch', 'POST /api/system/kill-switch', 'Implemented'],
  ['Paper trading controls', 'POST /api/paper/start, /api/paper/stop', 'Implemented'],
  ['Live trading controls', 'POST /api/live/start, /api/live/stop', 'Implemented'],
  ['Portfolio summary', 'GET /api/portfolio', 'Implemented'],
  ['Open positions', 'GET /api/positions', 'Implemented'],
  ['Orders and cancellation', 'GET /api/orders, DELETE /api/orders/{id}', 'Implemented'],
  ['Completed trades', 'GET /api/trades', 'Implemented'],
  ['Performance', 'GET /api/performance, /weekly, /monthly', 'Implemented'],
  ['Risk parameters and events', 'GET /api/risk, /api/risk/events', 'Implemented'],
  ['Stock universe', 'GET /api/stocks, /api/stocks/{symbol}, /api/stocks/sectors', 'Implemented'],
  ['Screener', 'GET /api/screener, /api/screener/criteria', 'Implemented'],
  ['Market data', 'GET /api/market-data/{symbol}, /candles, /status', 'Implemented'],
  ['Indicators', 'GET /api/indicators/{symbol}', 'Implemented'],
  ['AI decisions', 'GET /api/ai/decisions, POST /api/ai/analyze/{symbol}', 'Implemented'],
  ['ML models', 'GET /api/ml/models, /probability-threshold', 'Implemented'],
  ['Learning reports', 'GET /api/learning/daily, /mistakes, /adaptations', 'Implemented'],
  ['Backtest', 'POST /api/backtest', 'Implemented'],
  ['Realtime quotes', '/topic/quotes, /topic/quotes/{symbol}', 'Implemented'],
  ['Realtime signals', '/topic/signals', 'Implemented'],
  ['Realtime AI decisions', '/topic/ai/decisions', 'Implemented'],
  ['Realtime orders', '/topic/orders', 'Implemented'],
  ['Realtime risk alerts', '/topic/risk/alerts', 'Implemented'],
  ['Realtime system events', '/topic/system', 'Implemented'],
  ['Rankings endpoint', 'GET /api/rankings', 'Implemented'],
  ['Signals REST endpoint', 'GET /api/signals', 'Implemented'],
  ['Standalone models alias', 'GET /api/models', 'Implemented'],
  ['Manual order placement', 'POST /api/orders', 'Implemented with Risk Engine validation'],
  ['Broker credentials UI', 'N/A', 'Intentionally not exposed for security']
];
