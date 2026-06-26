# Module 21 — AI Features

## Architecture
Algorithmic AI features using existing data — no external ML services required.

## Features

### 1. Recommendations
- Analyzes user's order history (products, stores, categories)
- Recommends products from preferred categories/stores not yet purchased
- Ranked by product rating
- Returns recommendation context (order count, top categories, preferred stores)

### 2. Demand Forecasting
- Uses historical order data (4x forecast window, max 90 days)
- Calculates daily averages for orders, revenue, items
- Detects trend (INCREASING/DECREASING/STABLE) by comparing recent vs older periods
- Applies weekend multiplier (1.2x) and trend factor for future predictions
- Returns day-by-day forecast with predicted orders, revenue, items

### 3. Smart Search
- Term-based scoring: name match (+10), name prefix match (+5), description match (+3)
- Combines text relevance with product rating score
- Returns ranked results with total match count

### 4. Fraud Detection
- Multi-factor scoring: rapid orders, failed payments, untrusted devices, rapid withdrawals, high-value orders
- Returns fraud score, risk level (LOW/MEDIUM/HIGH/BLOCKED), factors breakdown
- Recommendation: ALLOW / MONITOR / REVIEW_REQUIRED

## API Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/ai/recommendations` | Bearer | Personalized product recommendations |
| GET | `/api/v1/ai/search` | Bearer | Smart search with relevance scoring |
| GET | `/api/v1/ai/demand-forecast` | ADMIN/MERCHANT | Demand forecast (days, storeId) |
| GET | `/api/v1/ai/fraud-detection/:userId` | ADMIN | Fraud detection for specific user |
| GET | `/api/v1/ai/fraud-detection` | Bearer | Fraud detection for self |

## Files
- `src/modules/ai/ai.schema.ts` — Zod validation
- `src/modules/ai/ai.service.ts` — Recommendations, forecasting, smart search, fraud detection
- `src/modules/ai/ai.controller.ts` — HTTP controllers
- `src/modules/ai/ai.routes.ts` — Routes with RBAC
- `tests/ai.schema.test.ts` — 9 tests
