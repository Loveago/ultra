# Module 6 — Search & Discovery

## Architecture

The search module provides:
- **Global search**: Searches both products and stores in one query
- **Product search**: Full-text search with filters (price, category, store, rating) and sorting
- **Store search**: Name/description search with pagination
- **Trending products**: Sorted by total ratings + rating score
- **Recommendations**: Based on merchant's product categories (personalization will improve with order history in later modules)
- **Available filters**: Dynamic filter options (price range, categories, stores) based on current product catalog

### Elasticsearch-Ready
The current implementation uses Postgres `ILIKE` for text search with a `tsvector` column + GIN index ready for future Elasticsearch migration. The service interface is designed to be swappable — replace the Prisma queries with Elasticsearch client calls without changing controllers/routes.

## Database Design

### Schema changes
- **Product**: Added `rating` (Float, default 0), `totalRatings` (Int, default 0), `searchVector` (tsvector)
- **SearchAnalytics**: New model — tracks searchTerm, resultCount, userId, createdAt for analytics

### Search infrastructure
- **tsvector column**: Auto-generated from `name` + `description` via database trigger
- **GIN index**: On `searchVector` for fast full-text search
- **Trigger**: `update_product_search_vector()` auto-updates the vector on insert/update

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/search` | Bearer | Global search (products + stores) |
| GET | `/api/v1/search/products` | Bearer | Product search with filters + sorting |
| GET | `/api/v1/search/stores` | Bearer | Store search with pagination |
| GET | `/api/v1/search/trending` | Bearer | Trending products (by ratings) |
| GET | `/api/v1/search/recommendations` | Bearer | Personalized recommendations |
| GET | `/api/v1/search/filters` | Bearer | Available filters (price range, categories, stores) |

### Product Search Filters
- `q` (required): Search query
- `storeId`: Filter by store
- `categoryId`: Filter by category
- `minPrice` / `maxPrice`: Price range
- `minRating`: Minimum rating (0-5)
- `sortBy`: `relevance` | `price_asc` | `price_desc` | `rating` | `newest`
- `page` / `limit`: Pagination (max 50 per page)

## Security Implications

1. **All endpoints require authentication** — `authenticate` middleware applied at router level
2. **Only approved products shown** — Search results filtered by `moderationStatus = APPROVED` and `isAvailable = true`
3. **Only active stores shown** — Store search filtered by `status = ACTIVE`
4. **Search analytics**: Search terms logged without requiring user ID (privacy-preserving)
5. **Pagination capped**: Max 50 results per page for products, 20 for global search

## Scalability Considerations

- **tsvector + GIN index**: Full-text search at database level — no external service needed for MVP
- **SearchAnalytics indexed** on `searchTerm` and `createdAt` for fast analytics queries
- **Product indexes**: `storeId`, `categoryId`, `moderationStatus` indexed for filter performance
- **Elasticsearch migration path**: Service interface designed to be swappable — replace Prisma queries with ES client
- **Recommendation engine**: Currently category-based; will be enhanced with order history (Module 10) and AI features (Module 21)
- **Pagination**: All list endpoints support page/limit with total count

## Files Added/Modified

- `prisma/schema.prisma` — Added rating/totalRatings to Product, searchVector column, SearchAnalytics model
- `prisma/migrations/20260625112416_search_discovery/` — Migration + search_vector.sql (trigger + GIN index)
- `prisma/migrations/20260625113102_product_ratings/` — Migration for rating fields
- `src/modules/search/search.schema.ts` — Zod validation for all search inputs
- `src/modules/search/search.service.ts` — Search, trending, recommendations, filters services
- `src/modules/search/search.controller.ts` — HTTP controllers
- `src/modules/search/search.routes.ts` — All routes behind authenticate
- `tests/search.schema.test.ts` — 10 unit tests for schema validation
