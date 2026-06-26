# Module 9 — Payment System

## Architecture

The payment module handles:
- **Paystack integration**: Transaction initialization, verification, webhook handling
- **Wallet payments**: In-app wallet with balance tracking and transaction history
- **Refunds**: Full and partial refunds for Paystack and wallet payments
- **Escrow**: Funds held on payment, released to merchant on delivery confirmation
- **Settlement engine**: Per-store-group settlement with platform commission (10%)

### Payment flow
```
Order created (PENDING) → Initialize Paystack / Wallet pay
→ Payment SUCCESS → Order status: CONFIRMED
→ Escrow created per store group (HELD)
→ On delivery → Admin releases escrow
→ Merchant wallet credited → Settlement: SETTLED
```

### Escrow & Settlement
- On successful payment, an `Escrow` record is created per `OrderStoreGroup` with status `HELD`
- When admin releases escrow, the store amount is credited to the merchant's wallet
- The `Settlement` record tracks: storeAmount, platformFee (10% of subtotal), deliveryFee, totalAmount
- Settlement status moves from PENDING → SETTLED when escrow is released

## Database Design

### New enums
| Enum | Values |
|---|---|
| `PaymentProvider` | PAYSTACK, WALLET, CASH_ON_DELIVERY |
| `PaymentRecordStatus` | PENDING, SUCCESS, FAILED, REFUNDED, PARTIALLY_REFUNDED |
| `RefundStatus` | PENDING, APPROVED, COMPLETED, REJECTED |
| `EscrowStatus` | HELD, RELEASED, REFUNDED |
| `SettlementStatus` | PENDING, PROCESSING, SETTLED, FAILED |
| `WalletTransactionType` | CREDIT, DEBIT, REFUND, WITHDRAWAL, TOPUP |

### New tables

| Table | Purpose |
|---|---|
| `Payment` | 1:1 with Order — provider, providerRef, amount, status, paidAt |
| `PaymentRefund` | N:1 with Payment — amount, reason, status, providerRef |
| `Wallet` | 1:1 with User — balance, pendingBalance, currency |
| `WalletTransaction` | N:1 with Wallet — type, amount, balanceBefore/After, reference |
| `Escrow` | 1:1 with OrderStoreGroup — amount, status (HELD/RELEASED), releasedAt |
| `Settlement` | 1:1 with OrderStoreGroup — storeAmount, platformFee, deliveryFee, status |

### Key design decisions
- **Paystack only**: Flutterwave and Stripe removed from enum — can be added later
- **Platform commission**: 10% of store group subtotal (configurable via `PLATFORM_COMMISSION_RATE` env var)
- **Wallet auto-creation**: Wallet created on first access (getOrCreateWallet pattern)
- **Transaction atomicity**: Wallet payments use Prisma `$transaction` for atomic balance update + transaction log
- **Webhook signature verification**: Paystack webhook verified via `x-paystack-signature` header
- **Escrow per store group**: Each store in a multi-vendor order has independent escrow + settlement

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/payments/paystack/initialize` | Bearer | Initialize Paystack transaction |
| GET | `/api/v1/payments/paystack/verify/:reference` | Bearer | Verify Paystack transaction |
| POST | `/api/v1/payments/paystack/webhook` | Public | Paystack webhook (signature verified) |
| POST | `/api/v1/payments/wallet/pay` | Bearer | Pay with wallet balance |
| GET | `/api/v1/payments/wallet/balance` | Bearer | Get wallet balance |
| GET | `/api/v1/payments/wallet/transactions` | Bearer | Wallet transaction history |
| POST | `/api/v1/payments/refund` | ADMIN | Initiate refund (Paystack or wallet) |
| POST | `/api/v1/payments/escrow/:storeGroupId/release` | ADMIN | Release escrow to merchant |
| GET | `/api/v1/payments/settlements` | MERCHANT | Merchant settlement history |
| POST | `/api/v1/payments/settlements/process` | ADMIN | Process pending settlements |

## Security Implications

1. **Webhook signature verification**: Paystack webhook checks `x-paystack-signature` header against env secret
2. **Order ownership**: Paystack initialization and wallet payment verify order belongs to user
3. **Double-pay prevention**: Checks `paymentStatus === PAID` before processing
4. **Insufficient balance check**: Wallet payment verifies sufficient balance before debit
5. **Admin-only operations**: Refunds, escrow release, and settlement processing require ADMIN/SUPER_ADMIN
6. **Atomic wallet transactions**: Balance update + transaction log in single Prisma transaction
7. **Refund amount validation**: Cannot refund more than original payment amount

## Scalability Considerations

- Payment indexed on `status` and `provider` for admin queries
- WalletTransaction indexed on `walletId` and `reference` for fast lookups
- Escrow and Settlement have unique constraints on `storeGroupId` — one per store group
- Settlement processing is batch-capable: processes all PENDING settlements in one call
- Platform commission rate is env-configurable — can adjust without code changes
- Paystack API calls use native `fetch` — no additional SDK dependency
- For high-volume: settlement processing can be moved to a BullMQ worker (already set up in infrastructure)

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | `sk_test_placeholder` | Paystack secret key |
| `PAYSTACK_BASE_URL` | `https://api.paystack.co` | Paystack API base URL |
| `PAYSTACK_WEBHOOK_SECRET` | `wh_placeholder` | Paystack webhook secret |
| `PLATFORM_COMMISSION_RATE` | `0.1` | Platform commission (10%) |

## Files Added/Modified

- `prisma/schema.prisma` — 6 new enums, 6 new models, payment/wallet relations on Order/User/OrderStoreGroup
- `prisma/migrations/20260625115821_payment_system/migration.sql` — Migration applied
- `src/config/env.ts` — Added Paystack + commission env vars
- `.env.example` — Added Paystack + commission env vars
- `src/modules/payment/payment.schema.ts` — Zod validation for payment inputs
- `src/modules/payment/payment.service.ts` — Paystack, wallet, refund, escrow, settlement services
- `src/modules/payment/payment.controller.ts` — HTTP controllers
- `src/modules/payment/payment.routes.ts` — Routes with RBAC (webhook public, refunds/escrow admin-only)
- `tests/payment.schema.test.ts` — 10 unit tests for schema validation
- `src/modules/checkout/checkout.schema.ts` — Updated to remove FLUTTERWAVE/STRIPE
- `tests/checkout.schema.test.ts` — Updated to remove STRIPE reference
