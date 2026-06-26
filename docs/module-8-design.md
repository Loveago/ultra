# Module 8 — Checkout System

## Architecture

The checkout module orchestrates the transition from cart to order through a 4-step flow:

1. **Initiate**: Validate cart, group items by store, fetch delivery zones
2. **Delivery options**: Get available delivery options per store group
3. **Validate**: Verify address, product availability, delivery constraints, payment method
4. **Create order**: Generate order number, create order + items + store groups, clear cart

### Order creation flow
```
Cart → initiateCheckout (validate cart, group by store)
     → getDeliveryOptions (per-store zones + options)
     → validateCheckout (address, products, payment method)
     → createOrder (order + items + storeGroups, clear cart)
```

### Multi-vendor order splitting
Each order contains `OrderStoreGroup` records — one per store. Each group has its own subtotal, tax, delivery fee, and status. This enables per-store fulfillment tracking.

## Database Design

### New enums
| Enum | Values |
|---|---|
| `OrderStatus` | PENDING, CONFIRMED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED |
| `PaymentStatus` | PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED |
| `DeliveryOption` | STANDARD, EXPRESS, SCHEDULED, PICKUP |
| `PaymentMethod` | PAYSTACK, FLUTTERWAVE, STRIPE, WALLET, CASH_ON_DELIVERY |

### New tables

| Table | Purpose |
|---|---|
| `Order` | Main order — orderNumber, totals, status, delivery info, payment method |
| `OrderItem` | N:1 with Order — product snapshot with price/addons at order time |
| `OrderStoreGroup` | N:1 with Order — per-store subtotal/tax/delivery/total + status |

### Key design decisions
- **Order number**: Generated as `ORD-{timestamp36}-{random4}` — unique, sortable, human-readable
- **Item price snapshot**: OrderItem stores `unitPrice` at order time — not a reference to Product
- **Store group splitting**: Each store gets its own `OrderStoreGroup` with independent status
- **Cart cleared on order creation**: Items moved to order, cart reset to zero
- **Tax rate**: 7.5% VAT (configurable constant)
- **Delivery address**: Stored as `deliveryAddressId` reference to Address table

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/checkout/initiate` | Bearer | Initiate checkout (validate cart, group by store) |
| GET | `/api/v1/checkout/delivery-options` | Bearer | Get delivery options per store group |
| POST | `/api/v1/checkout/validate` | Bearer | Validate address + products + payment method |
| POST | `/api/v1/checkout/create` | Bearer | Create order from validated checkout |

## Security Implications

1. **All endpoints require authentication** — user-scoped via JWT
2. **Address ownership**: Validates that delivery address belongs to authenticated user
3. **Product availability re-check**: At validation time, verifies all products are still APPROVED and available
4. **Scheduled delivery validation**: SCHEDULED option requires `scheduledFor` timestamp
5. **Payment method enum**: Only allowed payment methods accepted
6. **Cart cleared after order**: Prevents duplicate orders from same cart
7. **Order number uniqueness**: Database unique constraint on `orderNumber`

## Scalability Considerations

- Order indexed on `userId`, `status`, and `orderNumber` for fast lookups
- OrderItem indexed on `orderId` and `storeId` for per-store queries
- OrderStoreGroup indexed on `orderId` and `storeId` for merchant dashboards
- Order creation is a single Prisma transaction (nested create) — atomic
- Store group queries enable per-store analytics without scanning all order items
- For high-volume: order number generation is collision-resistant without DB sequence

## Files Added/Modified

- `prisma/schema.prisma` — 4 new enums, 3 new models, orders relation on User
- `prisma/migrations/20260625114615_checkout_system/migration.sql` — Migration applied
- `src/modules/checkout/checkout.schema.ts` — Zod validation for checkout inputs
- `src/modules/checkout/checkout.service.ts` — Initiate, delivery options, validate, create order
- `src/modules/checkout/checkout.controller.ts` — HTTP controllers
- `src/modules/checkout/checkout.routes.ts` — All routes behind authenticate
- `tests/checkout.schema.test.ts` — 10 unit tests for schema validation
