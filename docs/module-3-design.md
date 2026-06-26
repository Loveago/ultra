# Module 3 — User Profiles

## Architecture

The profile module follows the same clean architecture pattern:

- **Schema layer** (`profile.schema.ts`): Zod validation for profile, address, and preferences inputs
- **Service layer** (`profile.service.ts`): Business logic — profile upsert, address CRUD with default management, preferences upsert
- **Controller layer** (`profile.controller.ts`): Thin HTTP handlers with OpenAPI annotations
- **Route layer** (`profile.routes.ts`): All routes behind `authenticate` middleware

## Database Design

### New tables

| Table | Purpose |
|---|---|
| `UserProfile` | 1:1 with User — firstName, lastName, avatarUrl, dateOfBirth, gender, bio |
| `Address` | 1:N with User — labeled addresses with lat/lng, isDefault flag |
| `UserPreferences` | 1:1 with User — language, currency, dark mode, notification toggles |

### Key design decisions
- **Upsert pattern**: Profile and preferences use `upsert` — created on first access if they don't exist
- **Default address management**: Setting a new default auto-unsets the previous default
- **Cascade deletes**: All profile data is deleted when the user is deleted
- **Indexed**: `Address.userId` indexed for fast lookups

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/profile` | Bearer | Get profile + preferences |
| PUT | `/api/v1/profile` | Bearer | Update profile fields |
| GET | `/api/v1/profile/addresses` | Bearer | List all saved addresses |
| POST | `/api/v1/profile/addresses` | Bearer | Add new address |
| PUT | `/api/v1/profile/addresses/:id` | Bearer | Update address |
| DELETE | `/api/v1/profile/addresses/:id` | Bearer | Delete address |
| GET | `/api/v1/profile/preferences` | Bearer | Get preferences (auto-creates if missing) |
| PUT | `/api/v1/profile/preferences` | Bearer | Update preferences |

## Security Implications

1. **All endpoints require JWT authentication** — `authenticate` middleware applied at router level
2. **User-scoped queries** — All operations use `req.auth.userId` from JWT, never from URL params
3. **Address ownership check** — Update/delete verifies the address belongs to the authenticated user
4. **Input validation** — Zod schemas on all mutation endpoints
5. **No mass assignment** — Only whitelisted fields are accepted in updates

## Scalability Considerations

- Profile and preferences are 1:1 with User — no join overhead
- Addresses are indexed on `userId` for fast user-scoped queries
- Default address management uses `updateMany` (single query to unset previous default)
- Preferences auto-create on first access — no need for explicit initialization during registration

## Files Added/Modified

- `prisma/schema.prisma` — Added Gender enum, UserProfile, Address, UserPreferences models
- `prisma/migrations/20260625104829_user_profiles/migration.sql` — Migration applied
- `src/modules/profile/profile.schema.ts` — Zod validation schemas
- `src/modules/profile/profile.service.ts` — Profile, address, and preferences service
- `src/modules/profile/profile.controller.ts` — HTTP controllers with OpenAPI docs
- `src/modules/profile/profile.routes.ts` — All routes behind authenticate middleware
- `tests/profile.schema.test.ts` — 8 unit tests for schema validation
