# Module 4 — Merchant System

## Architecture

Two sub-modules under `modules/merchant/`:

- **Merchant sub-module**: Registration, KYC document management, KYC review (admin), dashboard
- **Store sub-module**: Store CRUD, branches, operating hours, delivery zones

Both use `authenticate` + `authorize` middleware for role-based access control.

### KYC Workflow
```
PENDING → (upload doc) → UNDER_REVIEW → (admin reviews all docs)
  → all APPROVED → APPROVED (merchant verified)
  → any REJECTED → REJECTED (with reason)
```

## Database Design

### New enums
| Enum | Values |
|---|---|
| `MerchantStatus` | PENDING, UNDER_REVIEW, APPROVED, REJECTED, SUSPENDED |
| `BusinessType` | SOLE_PROPRIETOR, PARTNERSHIP, LLC, CORPORATION, COOPERATIVE, NON_PROFIT |
| `KycDocumentType` | BUSINESS_REGISTRATION, TAX_CERTIFICATE, ID_CARD, UTILITY_BILL, BANK_STATEMENT, OPERATING_LICENSE |
| `KycDocumentStatus` | PENDING, APPROVED, REJECTED |
| `StoreStatus` | ACTIVE, INACTIVE, SUSPENDED, PENDING_REVIEW |
| `DayOfWeek` | MONDAY through SUNDAY |

### New tables

| Table | Purpose |
|---|---|
| `Merchant` | 1:1 with User — business info, KYC status |
| `KycDocument` | N:1 with Merchant — document uploads with review tracking |
| `Store` | N:1 with Merchant — store catalog with slug, rating, settings |
| `StoreBranch` | N:1 with Store — physical locations with lat/lng |
| `OperatingHour` | N:1 with StoreBranch — per-day hours (unique on branchId+dayOfWeek) |
| `DeliveryZone` | N:1 with StoreBranch — circular zones with fee, ETA, min order |

### Key design decisions
- **Store slug is unique** — used for public URLs
- **Operating hours use unique constraint** on `(branchId, dayOfWeek)` — one entry per day
- **Delivery zones are circular** (lat/lng + radiusKm) — simple and efficient for MVP
- **Main branch management**: setting a new main branch auto-unsets the previous one
- **KYC auto-approval**: when all documents are approved, merchant status auto-updates to APPROVED

## API Endpoints

### Merchant endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/merchants/register` | MERCHANT | Register merchant profile |
| GET | `/api/v1/merchants/me` | MERCHANT | Get my merchant profile + KYC + stores |
| POST | `/api/v1/merchants/kyc/documents` | MERCHANT | Upload KYC document |
| GET | `/api/v1/merchants/kyc/status` | MERCHANT | Check KYC status |
| POST | `/api/v1/merchants/kyc/:id/review` | ADMIN/SUPER_ADMIN | Approve/reject KYC document |
| GET | `/api/v1/merchants/dashboard` | MERCHANT | Dashboard stats |

### Store endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/stores` | MERCHANT | Create store |
| GET | `/api/v1/stores` | MERCHANT | List my stores |
| GET | `/api/v1/stores/:id` | Authenticated | Get store details (public) |
| PUT | `/api/v1/stores/:id` | MERCHANT | Update store |
| POST | `/api/v1/stores/:id/branches` | MERCHANT | Add branch |
| PUT | `/api/v1/stores/:id/branches/:branchId` | MERCHANT | Update branch |
| POST | `/api/v1/stores/:id/branches/:branchId/hours` | MERCHANT | Set operating hours (replaces all) |
| POST | `/api/v1/stores/:id/branches/:branchId/delivery-zones` | MERCHANT | Add delivery zone |

## Security Implications

1. **Role-based access**: Merchant endpoints require MERCHANT role; KYC review requires ADMIN/SUPER_ADMIN
2. **Ownership verification**: All store/branch operations verify the store belongs to the authenticated merchant
3. **KYC review tracking**: Reviewer ID and timestamp recorded for audit trail
4. **Slug validation**: Only lowercase alphanumeric + hyphens allowed (prevents URL injection)
5. **File URL validation**: KYC document URLs must be valid URLs (cloud storage expected)
6. **Store detail endpoint**: Public to authenticated users (for browsing), but mutations are merchant-only

## Scalability Considerations

- Merchant status indexed for admin queries (e.g., "show all pending merchants")
- Store slug indexed for fast public lookups
- Store merchantId indexed for merchant-scoped queries
- Branch storeId indexed for branch lookups
- Operating hours use unique constraint to prevent duplicates
- Delivery zones are simple circular areas — can be upgraded to PostGIS polygons later
- KYC auto-approval logic runs on each review, checking all documents in a single query

## Files Added/Modified

- `prisma/schema.prisma` — 6 new enums, 6 new models
- `prisma/migrations/20260625110416_merchant_system/migration.sql` — Migration applied
- `src/modules/merchant/merchant.schema.ts` — Zod validation for all merchant/store inputs
- `src/modules/merchant/merchant.service.ts` — Merchant registration, KYC, dashboard services
- `src/modules/merchant/merchant.controller.ts` — Merchant HTTP controllers
- `src/modules/merchant/merchant.routes.ts` — Merchant routes with RBAC
- `src/modules/merchant/store.service.ts` — Store, branch, operating hours, delivery zone services
- `src/modules/merchant/store.controller.ts` — Store HTTP controllers
- `src/modules/merchant/store.routes.ts` — Store routes with RBAC
- `tests/merchant.schema.test.ts` — 12 unit tests for schema validation
