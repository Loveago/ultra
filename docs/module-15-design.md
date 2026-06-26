# Module 15 — Reviews & Ratings

## Architecture

The review module provides:
- **Product reviews**: Customers review products after purchase
- **Store reviews**: Customers review stores/merchants
- **Rider reviews**: Customers review delivery riders
- **Moderation system**: Admin approves/rejects/flags reviews with audit log
- **Replies**: Store owners can reply to store reviews; admins can reply to all
- **Helpful votes**: Users can mark reviews as helpful
- **Rating aggregation**: Average rating recalculated on review create/update/delete/moderate
- **Review summary**: Distribution (1-5 stars), average, total count

### Review lifecycle
```
Customer creates review → PENDING
→ Admin moderates → APPROVED / REJECTED / FLAGGED
→ If APPROVED: target rating recalculated
→ Store owner/admin can reply
→ Users can mark helpful
```

## Database Design

### New enums
| Enum | Values |
|---|---|
| `ReviewTargetType` | PRODUCT, STORE, RIDER |
| `ReviewStatus` | PENDING, APPROVED, REJECTED, FLAGGED |

### New tables

| Table | Purpose |
|---|---|
| `Review` | userId, targetType, targetId, orderId, rating, title, comment, images, status, helpfulCount, reply |
| `ReviewModerationLog` | reviewId, action, reason, moderatedBy — audit trail for moderation actions |

### Key design decisions
- **One review per target per order**: `@@unique([userId, targetType, targetId, orderId])` prevents duplicates
- **Rating recalculation**: When approved reviews change, target's average rating is recalculated
- **Moderation audit**: Every moderation action logged with moderator ID and reason
- **Reply authorization**: Store owners can reply to their store's reviews; admins can reply to all
- **Images as JSON**: Array of image URLs (max 5)
- **Sort options**: By createdAt, rating, or helpfulCount; asc or desc

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/reviews` | Bearer | List reviews (filterable, sortable, paginated) |
| GET | `/api/v1/reviews/summary/:targetType/:targetId` | Bearer | Rating summary (avg, distribution) |
| GET | `/api/v1/reviews/:id` | Bearer | Get single review |
| POST | `/api/v1/reviews` | Bearer | Create review |
| PUT | `/api/v1/reviews/:id` | Bearer | Update own review |
| DELETE | `/api/v1/reviews/:id` | Bearer | Delete own review |
| PUT | `/api/v1/reviews/:id/helpful` | Bearer | Mark review as helpful |
| PUT | `/api/v1/reviews/:id/reply` | Bearer | Reply to review (store owner/admin) |
| PUT | `/api/v1/reviews/:id/moderate` | ADMIN | Moderate review (approve/reject/flag) |

## Security Implications

1. **All endpoints require authentication**
2. **Own review only**: Users can only update/delete their own reviews
3. **Reply authorization**: Store owners can only reply to their store's reviews; admins can reply to all
4. **Admin moderation**: Only ADMIN/SUPER_ADMIN can moderate reviews
5. **Duplicate prevention**: Unique constraint prevents multiple reviews for same target+order
6. **Moderation audit**: All moderation actions logged with moderator identity

## Scalability Considerations

- Review indexed on `[targetType, targetId]`, `userId`, `status`, `rating` for efficient queries
- ReviewModerationLog indexed on `reviewId` for fast audit trail lookup
- Rating recalculation only triggered when approved reviews change
- List reviews paginated with configurable sort to prevent large payloads
- For high-volume: rating aggregation can be cached in Redis
- For scale: review summary can be precomputed and updated via background job

## Files Added/Modified

- `prisma/schema.prisma` — 2 new enums, 2 new models, reviews relation on User
- `prisma/migrations/20260625130031_reviews_ratings/migration.sql` — Migration applied
- `src/modules/review/review.schema.ts` — Zod validation for review inputs
- `src/modules/review/review.service.ts` — CRUD, moderation, replies, helpful, summary, rating aggregation
- `src/modules/review/review.controller.ts` — HTTP controllers
- `src/modules/review/review.routes.ts` — Routes with RBAC
- `tests/review.schema.test.ts` — 14 unit tests for schema validation
