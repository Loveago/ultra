# Module 2 — Authentication & Authorization

## Architecture

The auth module follows the same clean architecture pattern as Module 1:

- **Schema layer** (`auth.schema.ts`): Zod validation for all auth inputs
- **Service layer** (`auth.service.ts`): Business logic — registration, OTP, login, token rotation, password reset
- **Controller layer** (`auth.controller.ts`): Thin HTTP handlers that delegate to services
- **Route layer** (`auth.routes.ts`): Express router with validation + middleware wiring
- **Shared middleware**: `authenticate` (JWT verification) and `authorize` (RBAC role checks)

## Database Design

### Extended `User` model
- Added `emailVerifiedAt` and `phoneVerifiedAt` timestamps
- Relations to `RefreshToken`, `OtpCode`, `PasswordResetToken`

### New tables

| Table | Purpose |
|---|---|
| `RefreshToken` | Stores hashed refresh tokens with expiry + revocation tracking |
| `OtpCode` | One-time codes for account verification, password reset, and OTP login |
| `PasswordResetToken` | Secure password reset flow with hashed tokens and expiry |

### Security decisions
- **All tokens are hashed** (SHA-256) before storage — never store raw tokens
- **OTP codes are hashed** — same approach as tokens
- **Refresh token rotation**: old token is revoked on each refresh, new one issued
- **Password hashing**: bcrypt with cost factor 12

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register/email` | Public | Register with email + password |
| POST | `/api/v1/auth/register/phone` | Public | Register with phone + password |
| POST | `/api/v1/auth/otp/verify` | Public | Verify OTP code |
| POST | `/api/v1/auth/login` | Public | Login with email/phone + password |
| POST | `/api/v1/auth/refresh` | Public | Rotate access + refresh tokens |
| POST | `/api/v1/auth/password/forgot` | Public | Request password reset |
| POST | `/api/v1/auth/password/reset` | Public | Reset password with token |
| POST | `/api/v1/auth/logout` | Public | Revoke refresh token |
| GET | `/api/v1/auth/me` | Bearer JWT | Get current user profile |
| GET | `/api/v1/auth/admin/probe` | Bearer JWT + ADMIN | RBAC demo endpoint |

## Security Implications

1. **JWT Strategy**: Short-lived access tokens (15m default) + long-lived refresh tokens (7d default). Access tokens are stateless; refresh tokens are tracked in DB for revocation.
2. **Token Rotation**: Each refresh revokes the old token and issues a new pair, limiting replay attack windows.
3. **OTP Security**: 6-digit codes expire after 10 minutes, are single-use (consumedAt), and are stored hashed.
4. **Password Reset**: Uses a random 32-byte token (hashed in DB) + OTP sent to user's channel. Token expires in 30 minutes and is single-use.
5. **RBAC**: `authenticate` middleware extracts JWT claims; `authorize` middleware checks role against allowed roles per endpoint.
6. **Input Validation**: All endpoints use Zod schemas via `validateBody` middleware.
7. **Rate Limiting**: Global rate limiter from Module 1 applies to all auth endpoints.

## Scalability Considerations

- Refresh token lookups are indexed on `userId` for fast user-session queries
- OTP lookups indexed on `(target, purpose)` for quick verification
- Password reset tokens indexed on `userId`
- Token revocation is a simple `revokedAt` timestamp — no complex token blacklisting needed
- For horizontal scaling: JWT access tokens are stateless (no DB lookup needed), only refresh tokens require DB access

## Files Added/Modified

- `prisma/schema.prisma` — Extended with auth models
- `prisma/migrations/202606250002_auth/migration.sql` — Auth migration
- `src/config/env.ts` — JWT + OTP + reset token env vars
- `src/types/express/index.d.ts` — Express Request augmentation for `req.auth`
- `src/common/middleware/authenticate.ts` — JWT verification middleware
- `src/common/middleware/authorize.ts` — RBAC role-check middleware
- `src/modules/auth/auth.schema.ts` — Zod validation schemas
- `src/modules/auth/auth.utils.ts` — Hashing, OTP generation, duration parsing
- `src/modules/auth/auth.service.ts` — Auth business logic
- `src/modules/auth/auth.controller.ts` — HTTP controllers
- `src/modules/auth/auth.routes.ts` — Auth route definitions
- `tests/auth.utils.test.ts` — Unit tests for auth utilities
- `tests/health.e2e.test.ts` — Updated with mocks for cloud DB/Redis
