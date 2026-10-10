# SmartTrader Frontend Features

This React frontend is an independent operator console for the SmartTrader backend.

## Implemented Screens

- Authentication with JWT session storage.
- System Control: health, mode, market status, paper/live controls, kill switch.
- Market Intelligence: quote lookup, candles, indicators, stocks, sectors, screener, criteria.
- AI and ML Decisions: AI decision history, on-demand symbol analysis, deployed models, probability threshold.
- Execution Desk: portfolio, positions, orders, order cancellation, trades, risk parameters, rejected risk events.
- Realtime Events: SockJS/STOMP subscriptions for quotes, signals, AI decisions, orders, risk alerts, and system events.
- Feature Coverage: matrix of required workflows versus backend API availability.
- Learning Loop: daily learning report, mistakes, adaptations, weekly/monthly performance.
- Backtesting: fetch candles and submit them to the backend backtest engine with configurable simulation inputs.

## Backend Endpoints Used

- `POST /api/auth/login`
- `GET /api/health`
- `GET /api/system/status`
- `POST /api/system/kill-switch`
- `POST /api/paper/start`
- `POST /api/paper/stop`
- `POST /api/live/start`
- `POST /api/live/stop`
- `GET /api/portfolio`
- `GET /api/positions`
- `GET /api/orders`
- `DELETE /api/orders/{id}`
- `GET /api/trades`
- `GET /api/performance`
- `GET /api/performance/weekly`
- `GET /api/performance/monthly`
- `GET /api/risk`
- `GET /api/risk/events`
- `GET /api/stocks`
- `GET /api/stocks/{symbol}`
- `GET /api/stocks/sectors`
- `GET /api/screener`
- `GET /api/screener/criteria`
- `GET /api/rankings`
- `GET /api/signals`
- `GET /api/market-data/{symbol}`
- `GET /api/market-data/{symbol}/candles`
- `GET /api/market-data/status`
- `GET /api/indicators/{symbol}`
- `GET /api/ai/decisions`
- `POST /api/ai/analyze/{symbol}`
- `GET /api/ml/models`
- `GET /api/models`
- `GET /api/ml/probability-threshold`
- `GET /api/learning/daily`
- `GET /api/learning/mistakes`
- `GET /api/learning/adaptations`
- `POST /api/backtest`
- `POST /api/orders`

## Realtime Topics Used

- `/topic/quotes`
- `/topic/signals`
- `/topic/ai/decisions`
- `/topic/orders`
- `/topic/risk/alerts`
- `/topic/system`

## Backend Gap Policy

The frontend now calls the formerly missing backend endpoints: rankings, signals, top-level models, and manual order placement. Manual order placement is expected to pass through the backend Risk Engine before broker submission.
