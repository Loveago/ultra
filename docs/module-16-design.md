# Module 16 — Wallet & Finance

## Architecture

The finance module provides:
- **User wallets**: Balance, pending balance, transactions (reuses Wallet from Module 9)
- **Merchant wallets**: Same Wallet model — merchants are Users with wallets
- **Rider wallets**: Same Wallet model — riders are Users with wallets
- **Commissions**: CommissionLog tracks platform commission per order store group
- **Withdrawals**: Users request withdrawals, admin processes them
- **Finance overview**: Aggregated wallet + withdrawal stats per user

### Withdrawal flow
```
User requests withdrawal → balance deducted → WalletTransaction (WITHDRAWAL) created
→ Withdrawal record created (PENDING)
→ Admin approves → APPROVED → Admin processes → PROCESSING → COMPLETED
→ If rejected/cancelled → balance refunded → WalletTransaction (REFUND) created
```

## Database Design

### New enums
| Enum | Values |
|---|---|
| `WithdrawalStatus` | PENDING, APPROVED, PROCESSING, COMPLETED, REJECTED, CANCELLED |
| `WithdrawalMethod` | BANK_TRANSFER, PAYSTACK, WALLET |

### New tables

| Table | Purpose |
|---|---|
| `Withdrawal` | userId, amount, fee, netAmount, method, status, bank details, reference |
| `CommissionLog` | storeGroupId, orderId, merchantId, grossAmount, commissionRate, commissionAmount, merchantNetAmount |

### Existing tables used
| Table | From Module |
|---|---|
| `Wallet` | Module 9 (Payment) |
| `WalletTransaction` | Module 9 (Payment) |
| `Escrow` | Module 9 (Payment) |
| `Settlement` | Module 9 (Payment) |

### Key design decisions
- **Atomic balance deduction**: Wallet balance decremented before withdrawal creation
- **Withdrawal fee**: 1% (min 50) for bank transfer, 0 for Paystack/wallet
- **Refund on rejection**: If withdrawal rejected/cancelled, balance refunded + REFUND transaction created
- **Commission tracking**: CommissionLog records gross, commission rate, commission amount, merchant net
- **Auto-create wallet**: Wallet created on first access if it doesn't exist

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/finance/wallet` | Bearer | Wallet balance |
| GET | `/api/v1/finance/wallet/transactions` | Bearer | Wallet transaction history |
| GET | `/api/v1/finance/overview` | Bearer | Finance overview (balance, withdrawals, transactions) |
| POST | `/api/v1/finance/withdrawals` | Bearer | Request withdrawal |
| GET | `/api/v1/finance/withdrawals` | Bearer | List my withdrawals |
| GET | `/api/v1/finance/admin/withdrawals` | ADMIN | List all withdrawals |
| PUT | `/api/v1/finance/admin/withdrawals/:id` | ADMIN | Process withdrawal (approve/reject/complete) |
| GET | `/api/v1/finance/admin/commissions` | ADMIN | List commission logs |
| GET | `/api/v1/finance/admin/commissions/summary` | ADMIN | Commission summary |

## Security Implications

1. **All endpoints require authentication**
2. **User-scoped**: Users can only view their own wallet, transactions, withdrawals
3. **Admin-only processing**: Only ADMIN/SUPER_ADMIN can process withdrawals
4. **Admin-only commissions**: Only ADMIN/SUPER_ADMIN can view commission logs
5. **Balance validation**: Withdrawal amount checked against wallet balance
6. **Bank details required**: Bank transfer method requires bank name, account name, account number
7. **Atomic operations**: Balance deduction + transaction creation in sequence

## Scalability Considerations

- Withdrawal indexed on `userId`, `status`, `createdAt` for efficient queries
- CommissionLog indexed on `storeGroupId`, `orderId`, `merchantId`, `createdAt`
- WalletTransaction indexed on `walletId` and `reference`
- Aggregation queries use Prisma `aggregate` for efficient counting
- For high-volume: commission summary can be cached in Redis
- For scale: withdrawal processing can be queued via BullMQ

## Files Added/Modified

- `prisma/schema.prisma` — 2 new enums, 2 new models, withdrawals relation on User
- `prisma/migrations/20260625131521_wallet_finance/migration.sql` — Migration applied
- `src/modules/finance/finance.schema.ts` — Zod validation for finance inputs
- `src/modules/finance/finance.service.ts` — Wallet, withdrawals, commissions, overview
- `src/modules/finance/finance.controller.ts` — HTTP controllers
- `src/modules/finance/finance.routes.ts` — Routes with RBAC
- `tests/finance.schema.test.ts` — 10 unit tests for schema validation
