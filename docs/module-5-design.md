# Module 5 — Product Catalog

## Architecture

The catalog module is split into two service files:

- **`catalog.service.ts`**: Categories (hierarchical), products CRUD, bulk import/update, moderation
- **`catalog-variants.service.ts`**: Variants, addons, images, inventory management

Both share the same schema, controller, and routes files.

### Moderation Workflow
```
Product created (DRAFT, PENDING) → Admin reviews → APPROVED (status → ACTIVE) / REJECTED (status → DRAFT, with note)
```

## Database Design

### New enums
| Enum | Values |
|---|---|
| `ProductStatus` | DRAFT, ACTIVE, INACTIVE, ARCHIVED |
| `ModerationStatus` | PENDING, APPROVED, REJECTED |

### New tables

| Table | Purpose |
|---|---|
| `Category` | Self-referencing hierarchy (parent/child) with slug, iconUrl, sortOrder |
| `Product` | Store-scoped product with unique slug per store, basePrice, moderation fields |
| `ProductVariant` | N:1 Product — name, SKU, priceAdjustment, attributes (JSON) |
| `ProductAddon` | N:1 Product — name, price, isRequired, maxSelectable |
| `ProductImage` | N:1 Product — url, altText, sortOrder |
| `Inventory` | 1:1 ProductVariant — quantity, reservedQty, lowStockThreshold |

### Key design decisions
- **Category hierarchy**: Self-referencing with `parentId`, `onDelete: SetNull` (deleting parent doesn't delete children)
- **Product slug unique per store**: `@@unique([storeId, slug])` — same slug allowed across different stores
- **Variant inventory**: Created automatically when variant is created (1:1 relation)
- **Bulk operations**: Max 100 items per batch, per-item error handling (partial success supported)
- **Moderation**: Admin-only, auto-sets product status to ACTIVE on approval

## API Endpoints

### Categories (5 endpoints)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/categories` | MERCHANT/ADMIN | Create category |
| GET | `/api/v1/categories` | Authenticated | List categories (with children) |
| GET | `/api/v1/categories/:id` | Authenticated | Get category |
| PUT | `/api/v1/categories/:id` | MERCHANT/ADMIN | Update category |
| DELETE | `/api/v1/categories/:id` | ADMIN | Delete category |

### Products (5 endpoints)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/products` | MERCHANT | Create product |
| GET | `/api/v1/products` | Authenticated | List products (filterable, paginated) |
| GET | `/api/v1/products/:id` | Authenticated | Get product detail |
| PUT | `/api/v1/products/:id` | MERCHANT | Update product |
| DELETE | `/api/v1/products/:id` | MERCHANT | Delete product |

### Variants (4 endpoints)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/products/:id/variants` | MERCHANT | Create variant (auto-creates inventory) |
| GET | `/api/v1/products/:id/variants` | Authenticated | List variants |
| PUT | `/api/v1/products/:id/variants/:variantId` | MERCHANT | Update variant |
| DELETE | `/api/v1/products/:id/variants/:variantId` | MERCHANT | Delete variant |

### Addons (4 endpoints)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/products/:id/addons` | MERCHANT | Create addon |
| GET | `/api/v1/products/:id/addons` | Authenticated | List addons |
| PUT | `/api/v1/products/:id/addons/:addonId` | MERCHANT | Update addon |
| DELETE | `/api/v1/products/:id/addons/:addonId` | MERCHANT | Delete addon |

### Images (3 endpoints)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/products/:id/images` | MERCHANT | Add image |
| GET | `/api/v1/products/:id/images` | Authenticated | List images |
| DELETE | `/api/v1/products/:id/images/:imageId` | MERCHANT | Delete image |

### Inventory (1 endpoint)
| Method | Path | Auth | Description |
|---|---|---|---|
| PUT | `/api/v1/products/:id/variants/:variantId/inventory` | MERCHANT | Update inventory |

### Bulk + Moderation (3 endpoints)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/products/bulk-import` | MERCHANT | Bulk import (max 100) |
| PUT | `/api/v1/products/bulk-update` | MERCHANT | Bulk update (max 100) |
| POST | `/api/v1/products/:id/moderate` | ADMIN/SUPER_ADMIN | Approve/reject product |

## Security Implications

1. **Ownership verification**: All product/variant/addon/image mutations verify the product belongs to the merchant's store
2. **Moderation is admin-only**: Only ADMIN/SUPER_ADMIN can approve/reject products
3. **Category deletion is admin-only**: Prevents merchants from deleting shared categories
4. **Bulk operations scoped to merchant's stores**: Bulk update verifies product ownership per item
5. **Input validation**: Zod schemas on all mutation endpoints
6. **Pagination capped at 100**: Prevents excessive query loads

## Scalability Considerations

- Products indexed on `storeId`, `categoryId`, and `moderationStatus` for fast filtering
- Category `parentId` indexed for hierarchy queries
- Product slug has composite unique constraint `[@@unique([storeId, slug])]`
- Variant `productId` and `productId` on addons/images indexed for fast joins
- Inventory has unique constraint on `variantId` — one inventory record per variant
- Bulk operations support partial success — failed items don't block successful ones
- List endpoint includes pagination with total count

## Files Added/Modified

- `prisma/schema.prisma` — 2 new enums, 6 new models, products relation on Store
- `prisma/migrations/20260625111305_product_catalog/migration.sql` — Migration applied
- `src/modules/catalog/catalog.schema.ts` — Zod validation for all catalog inputs
- `src/modules/catalog/catalog.service.ts` — Category, product, bulk, moderation services
- `src/modules/catalog/catalog-variants.service.ts` — Variant, addon, image, inventory services
- `src/modules/catalog/catalog.controller.ts` — All HTTP controllers
- `src/modules/catalog/catalog.routes.ts` — All routes with RBAC
- `tests/catalog.schema.test.ts` — 15 unit tests for schema validation
