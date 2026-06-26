# Module 18 — Admin Panel Core

## Architecture
Centralized admin module for user, merchant, and rider management with system stats dashboard.

## API Endpoints (all ADMIN/SUPER_ADMIN)
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/stats` | System stats summary |
| GET | `/api/v1/admin/users` | List users (filter by role, search, isActive) |
| GET | `/api/v1/admin/users/:id` | Get user detail with relations |
| PUT | `/api/v1/admin/users/:id` | Update user role/active status |
| GET | `/api/v1/admin/merchants` | List merchants (filter by isVerified, search) |
| PUT | `/api/v1/admin/merchants/:id` | Verify/unverify merchant |
| GET | `/api/v1/admin/riders` | List riders (filter by status) |
| PUT | `/api/v1/admin/riders/:id` | Update rider status/online |

## Files
- `src/modules/admin/admin.schema.ts` — Zod validation
- `src/modules/admin/admin.service.ts` — CRUD + system stats
- `src/modules/admin/admin.controller.ts` — HTTP controllers
- `src/modules/admin/admin.routes.ts` — Routes with ADMIN RBAC
- `tests/admin.schema.test.ts` — 8 tests
