# Module 19 — Marketing Platform

## Architecture
Coupons, promotions, referrals, loyalty points, and cashback system.

## Database Design
### New enum: `CouponType` (PERCENTAGE, FIXED_AMOUNT, FREE_DELIVERY)
### New tables
| Table | Purpose |
|---|---|
| `Coupon` | Code, type, value, min order, max discount, usage limits, validity dates |
| `CouponRedemption` | Tracks per-user coupon usage |
| `Promotion` | Title, banner, discount, date range, product IDs |
| `Referral` | Referrer, referred, code, reward points/cashback |
| `LoyaltyTransaction` | Points earned/spent with type and description |
| `CashbackTransaction` | Cashback earned with order reference |

### User model additions: `referralCode`, `loyaltyPoints`, `cashbackBalance`

## API Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/marketing/promotions/active` | Bearer | Active promotions |
| POST | `/api/v1/marketing/coupons/validate` | Bearer | Validate coupon for order |
| POST | `/api/v1/marketing/referral/generate` | Bearer | Generate referral code |
| POST | `/api/v1/marketing/referral/apply` | Bearer | Apply referral code |
| GET | `/api/v1/marketing/loyalty/balance` | Bearer | Loyalty + cashback balance |
| GET | `/api/v1/marketing/loyalty/transactions` | Bearer | Loyalty history |
| GET | `/api/v1/marketing/cashback/transactions` | Bearer | Cashback history |
| GET/POST | `/api/v1/marketing/coupons` | ADMIN | List/create coupons |
| GET/POST | `/api/v1/marketing/promotions` | ADMIN | List/create promotions |

## Files
- `src/modules/marketing/marketing.schema.ts` — Zod validation
- `src/modules/marketing/marketing.service.ts` — Coupons, promotions, referrals, loyalty, cashback
- `src/modules/marketing/marketing.controller.ts` — HTTP controllers
- `src/modules/marketing/marketing.routes.ts` — Routes with RBAC
- `tests/marketing.schema.test.ts` — 8 tests
