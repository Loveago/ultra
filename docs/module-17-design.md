# Module 17 — Analytics Engine

## Architecture

The analytics module provides:
- **Revenue analytics**: Total revenue, order counts, avg order value, commission, payment provider breakdown
- **Order analytics**: Status breakdown, store group status, avg items per order, top stores by value
- **Merchant analytics**: Per-merchant order counts, revenue, commission, store ratings
- **Rider analytics**: Total/active/approved riders, assignment breakdown, top riders by deliveries
- **Dashboard summary**: High-level counts for admin overview

### Data sources
All analytics are computed from existing tables — no new DB tables needed:
- `Payment` → revenue, payment provider stats
- `Order` + `OrderStoreGroup` → order status, revenue per store
- `CommissionLog` → commission totals
- `Rider` + `DeliveryAssignment` → rider stats
- `User`, `Merchant`, `Product`, `Withdrawal`, `Review` → dashboard counts

## API Endpoints

All endpoints require ADMIN or SUPER_ADMIN role.

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/analytics/dashboard` | Dashboard summary (counts) |
| GET | `/api/v1/analytics/revenue` | Revenue analytics (date range filter) |
| GET | `/api/v1/analytics/orders` | Order analytics (status breakdown, top stores) |
| GET | `/api/v1/analytics/merchants` | Merchant analytics (optional merchantId filter) |
| GET | `/api/v1/analytics/riders` | Rider analytics (assignment breakdown, top riders) |

### Query parameters
- `startDate` (ISO datetime) — Filter from date
- `endDate` (ISO datetime) — Filter to date
- `merchantId` (UUID) — Filter by merchant (merchant analytics only)

## Security Implications

1. **All endpoints require authentication**
2. **Admin-only access**: All analytics endpoints restricted to ADMIN/SUPER_ADMIN
3. **No sensitive data exposure**: No PII in analytics responses
4. **Read-only**: No data modification — all endpoints are GET

## Scalability Considerations

- Uses Prisma `aggregate` and `groupBy` for efficient DB-level computation
- Date range filtering prevents full-table scans
- For high-volume: analytics can be cached in Redis with TTL
- For real-time: dashboard summary can be precomputed via cron job
- For scale: heavy aggregation queries can be moved to materialized views
- Payment provider grouping uses `groupBy` for single-query breakdown

## Files Added

- `src/modules/analytics/analytics.schema.ts` — Zod validation for date range inputs
- `src/modules/analytics/analytics.service.ts` — Revenue, order, merchant, rider, dashboard analytics
- `src/modules/analytics/analytics.controller.ts` — HTTP controllers
- `src/modules/analytics/analytics.routes.ts` — Routes with ADMIN/SUPER_ADMIN authorization
- `tests/analytics.schema.test.ts` — 8 unit tests for schema validation
