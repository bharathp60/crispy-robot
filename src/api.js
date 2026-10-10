const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const TOKEN_KEY = 'smarttrader.jwt';
const SESSION_KEY = 'smarttrader.session';

export function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

function saveSession(session) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function request(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || payload?.title || response.statusText;
    throw new Error(`${response.status} ${detail}`);
  }

  return payload;
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
const del = (path) => request(path, { method: 'DELETE' });

export async function login(username, password) {
  const session = await post('/api/auth/login', { username, password });
  saveSession(session);
  return session;
}

export const api = {
  baseUrl: API_BASE_URL,
  health: () => get('/api/health'),
  systemStatus: () => get('/api/system/status'),
  startPaper: () => post('/api/paper/start'),
  stopPaper: () => post('/api/paper/stop'),
  startLive: () => post('/api/live/start'),
  stopLive: () => post('/api/live/stop'),
  killSwitch: (reason) => post(`/api/system/kill-switch?reason=${encodeURIComponent(reason || 'Manual override')}`),
  portfolio: () => get('/api/portfolio'),
  positions: () => get('/api/positions'),
  orders: () => get('/api/orders'),
  placeOrder: (payload) => post('/api/orders', payload),
  cancelOrder: (id) => del(`/api/orders/${id}`),
  trades: () => get('/api/trades'),
  performance: () => get('/api/performance'),
  weeklyPerformance: () => get('/api/performance/weekly'),
  monthlyPerformance: () => get('/api/performance/monthly'),
  risk: () => get('/api/risk'),
  riskEvents: () => get('/api/risk/events'),
  stocks: () => get('/api/stocks'),
  sectors: () => get('/api/stocks/sectors'),
  stock: (symbol) => get(`/api/stocks/${encodeURIComponent(symbol)}`),
  screener: (profile) => get(`/api/screener?profile=${encodeURIComponent(profile)}`),
  screeningCriteria: (profile) => get(`/api/screener/criteria?profile=${encodeURIComponent(profile)}`),
  rankings: (profile) => get(`/api/rankings?profile=${encodeURIComponent(profile)}`),
  signals: (profile) => get(`/api/signals?profile=${encodeURIComponent(profile)}`),
  quote: (symbol) => get(`/api/market-data/${encodeURIComponent(symbol)}`),
  candles: (symbol, timeframe) => get(`/api/market-data/${encodeURIComponent(symbol)}/candles?timeframe=${encodeURIComponent(timeframe)}`),
  marketStatus: () => get('/api/market-data/status'),
  indicators: (symbol, timeframe) => get(`/api/indicators/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(timeframe)}`),
  aiDecisions: () => get('/api/ai/decisions'),
  analyzeSymbol: (symbol) => post(`/api/ai/analyze/${encodeURIComponent(symbol)}`),
  models: () => get('/api/ml/models'),
  modelsAlias: () => get('/api/models'),
  probabilityThreshold: () => get('/api/ml/probability-threshold'),
  learningDaily: () => get('/api/learning/daily'),
  mistakes: () => get('/api/learning/mistakes'),
  adaptations: () => get('/api/learning/adaptations'),
  backtest: (payload) => post('/api/backtest', payload)
};
