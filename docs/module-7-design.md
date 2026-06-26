# Module 7 — Cart System

## Architecture

The cart module provides:
- **Multi-vendor cart**: Single cart per user, items grouped by store for checkout splitting
- **Promo codes**: Percentage or fixed discount, with min order amount, max discount cap, usage limits, and validity windows
- **Tax calculation**: 7.5% VAT applied to subtotal (configurable via constant)
- **Delivery estimation**: Based on store delivery zones (fee + ETA per store)
- **Saved carts**: Snapshot cart items for later restoration

### Cart lifecycle
```
User adds items → Cart auto-created (1:1 with User) → Items grouped by storeId
→ Promo codes applied → Tax calculated (7.5%) → Delivery estimated from zones
→ Grand total = subtotal + tax - discount + delivery
```

## Database Design

### New enum
| Enum | Values |
|---|---|
| `PromoType` | PERCENTAGE, FIXED |

### New tables

| Table | Purpose |
|---|---|
| `Cart` | 1:1 with User — totals (subtotal, tax, discount, delivery, grand) |
| `CartItem` | N:1 with Cart — productId, variantId, quantity, unitPrice, addons (JSON), storeId |
| `PromoCode` | Store-scoped or global — code, type, value, limits, validity |
| `CartPromo` | Junction: Cart ↔ PromoCode — tracks discountAmount per cart |
| `SavedCart` | N:1 with User — name + items snapshot (JSON) |

### Key design decisions
- **1:1 Cart with User**: Auto-created on first access — no explicit "create cart" needed
- **Multi-vendor via storeId on CartItem**: Items from different stores in one cart, grouped for checkout
- **Addons stored as JSON**: Array of `{ addonId, name, price }` — denormalized for cart history
- **Promo code uniqueness**: `@@unique([cartId, promoCodeId])` — can't apply same code twice
- **Saved carts store item snapshots**: Not references — preserves prices at save time
- **Cart recalculation**: After every item/promo change, totals are recomputed

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/cart` | Bearer | Get cart (grouped by store) |
| POST | `/api/v1/cart/items` | Bearer | Add item to cart |
| PUT | `/api/v1/cart/items/:itemId` | Bearer | Update item (qty, addons, note) |
| DELETE | `/api/v1/cart/items/:itemId` | Bearer | Remove item |
| DELETE | `/api/v1/cart` | Bearer | Clear cart |
| POST | `/api/v1/cart/promo` | Bearer | Apply promo code |
| DELETE | `/api/v1/cart/promo/:promoId` | Bearer | Remove promo code |
| GET | `/api/v1/cart/estimate` | Bearer | Get delivery + tax estimate |
| POST | `/api/v1/cart/save` | Bearer | Save current cart (named) |
| GET | `/api/v1/cart/saved` | Bearer | List saved carts |
| POST | `/api/v1/cart/saved/:savedCartId/restore` | Bearer | Restore saved cart |

## Security Implications

1. **All endpoints require authentication** — cart is user-scoped via JWT
2. **Product availability check**: Adding items verifies product is APPROVED and available
3. **Variant availability check**: Verifies variant is active before adding
4. **Promo validation**: Checks active status, validity window, usage limits, min order amount
5. **Promo usage tracking**: `usedCount` incremented/decremented on apply/remove
6. **Ownership verification**: All cart operations use `req.auth.userId` — no URL-based user ID
7. **Quantity limits**: Max 99 per item to prevent abuse

## Scalability Considerations

- Cart is 1:1 with User — single cart lookup by `userId` (unique constraint)
- CartItem indexed on `cartId` and `storeId` for fast grouping
- PromoCode indexed on `code` (unique) for O(1) lookup
- CartPromo has unique constraint on `(cartId, promoCodeId)` — prevents duplicates
- SavedCart indexed on `userId` for fast user-scoped queries
- Cart recalculation is O(n) where n = items in cart — efficient for typical cart sizes
- Delivery estimation queries store delivery zones — indexed on `branchId`
- For high-traffic: Cart can be cached in Redis with TTL, synced to DB on mutation

## Files Added/Modified

- `prisma/schema.prisma` — 1 new enum, 5 new models, cart/savedCarts relations on User
- `prisma/migrations/20260625113832_cart_system/migration.sql` — Migration applied
- `src/modules/cart/cart.schema.ts` — Zod validation for cart inputs
- `src/modules/cart/cart.service.ts` — Cart CRUD, promo, estimate, saved carts services
- `src/modules/cart/cart.controller.ts` — HTTP controllers
- `src/modules/cart/cart.routes.ts` — All routes behind authenticate
- `tests/cart.schema.test.ts` — 11 unit tests for schema validation
