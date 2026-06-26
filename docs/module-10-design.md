# Module 10 — Order Management

## Architecture

The order module provides:
- **Order lifecycle**: Status transitions with guarded validation (only valid transitions allowed)
- **Status updates**: Both order-level and per-store-group status updates
- **Order timeline**: Every status change creates an `OrderTimeline` record for audit trail
- **Cancellations**: Customer can cancel before OUT_FOR_DELIVERY; admin can cancel anytime
- **Multi-perspective views**: Customer, merchant, and admin order lists with different data visibility

### Status transition rules
```
PENDING → CONFIRMED | CANCELLED
CONFIRMED → PREPARING | CANCELLED
PREPARING → READY_FOR_PICKUP | CANCELLED
READY_FOR_PICKUP → OUT_FOR_DELIVERY | CANCELLED
OUT_FOR_DELIVERY → DELIVERED | CANCELLED
DELIVERED → (terminal)
CANCELLED → (terminal)
```

### Multi-vendor order status
When all store groups in an order reach DELIVERED, the order status auto-updates to DELIVERED. When all are CANCELLED, the order auto-updates to CANCELLED.

## Database Design

### New table

| Table | Purpose |
|---|---|
| `OrderTimeline` | N:1 with Order — fromStatus, toStatus, changedBy, reason, note, createdAt |

### Key design decisions
- **Timeline audit trail**: Every status change recorded with who changed it and why
- **Guarded transitions**: `VALID_TRANSITIONS` map prevents invalid status jumps
- **Per-store-group lifecycle**: Each store group has independent status (multi-vendor)
- **Auto-aggregation**: Order status auto-updates when all store groups reach terminal state
- **Cancellation rules**: Customers can cancel before OUT_FOR_DELIVERY; only admin can cancel after

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/orders` | Bearer | List my orders (paginated, filterable by status) |
| GET | `/api/v1/orders/:id` | Bearer | Get order detail (with timeline, payment, store groups) |
| PUT | `/api/v1/orders/:id/status` | MERCHANT/ADMIN | Update order status |
| PUT | `/api/v1/orders/:id/store-groups/:groupId/status` | MERCHANT/ADMIN | Update store group status |
| POST | `/api/v1/orders/:id/cancel` | Bearer | Cancel order (customer or admin) |
| GET | `/api/v1/orders/:id/timeline` | Bearer | Get order timeline |
| GET | `/api/v1/orders/merchant/list` | MERCHANT | Merchant orders (filtered by store) |
| GET | `/api/v1/orders/admin/list` | ADMIN | All orders (admin view) |

## Security Implications

1. **All endpoints require authentication**
2. **Order ownership**: Customers can only view/cancel their own orders
3. **Merchant scope**: Merchants only see orders containing their store groups
4. **Admin override**: Admins can view all orders and cancel any order
5. **Cancellation restrictions**: Customers can't cancel delivered or out-for-delivery orders
6. **Status update authorization**: Only MERCHANT and ADMIN can update order/store-group status
7. **Timeline integrity**: Every change is recorded with the user who made it

## Scalability Considerations

- OrderTimeline indexed on `orderId` and `toStatus` for fast queries
- Merchant orders filtered via `storeGroups.some` relation — indexed on `storeId`
- Admin orders support status filtering and pagination
- Timeline grows linearly with status changes — typically 5-7 entries per order
- For high-volume: timeline can be archived to cold storage after order completion

## Files Added/Modified

- `prisma/schema.prisma` — Added OrderTimeline model, timeline relation on Order
- `prisma/migrations/20260625120836_order_management/migration.sql` — Migration applied
- `src/modules/order/order.schema.ts` — Zod validation for order inputs
- `src/modules/order/order.service.ts` — Order lifecycle, timeline, cancellation, list services
- `src/modules/order/order.controller.ts` — HTTP controllers
- `src/modules/order/order.routes.ts` — Routes with RBAC (customer/merchant/admin)
- `tests/order.schema.test.ts` — 10 unit tests for schema validation
