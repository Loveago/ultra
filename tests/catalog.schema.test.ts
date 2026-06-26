import {
  bulkImportSchema,
  createAddonSchema,
  createCategorySchema,
  createImageSchema,
  createProductSchema,
  createVariantSchema,
  moderateProductSchema,
  updateInventorySchema,
} from "../src/modules/catalog/catalog.schema";

describe("Catalog schemas", () => {
  it("createCategorySchema should accept valid category", () => {
    const result = createCategorySchema.safeParse({
      name: "Food",
      slug: "food",
    });
    expect(result.success).toBe(true);
  });

  it("createCategorySchema should accept subcategory with parentId", () => {
    const result = createCategorySchema.safeParse({
      parentId: "123e4567-e89b-12d3-a456-426614174000",
      name: "Pizza",
      slug: "pizza",
    });
    expect(result.success).toBe(true);
  });

  it("createCategorySchema should reject invalid slug", () => {
    const result = createCategorySchema.safeParse({
      name: "Food",
      slug: "Food Stuff!",
    });
    expect(result.success).toBe(false);
  });

  it("createProductSchema should accept valid product", () => {
    const result = createProductSchema.safeParse({
      storeId: "123e4567-e89b-12d3-a456-426614174000",
      name: "Margherita Pizza",
      slug: "margherita-pizza",
      basePrice: 15.99,
    });
    expect(result.success).toBe(true);
  });

  it("createProductSchema should reject negative price", () => {
    const result = createProductSchema.safeParse({
      storeId: "123e4567-e89b-12d3-a456-426614174000",
      name: "Pizza",
      slug: "pizza",
      basePrice: -5,
    });
    expect(result.success).toBe(false);
  });

  it("createVariantSchema should accept valid variant", () => {
    const result = createVariantSchema.safeParse({
      name: "Large",
      priceAdjustment: 3.0,
      initialQuantity: 50,
    });
    expect(result.success).toBe(true);
  });

  it("createVariantSchema should reject negative initial quantity", () => {
    const result = createVariantSchema.safeParse({
      name: "Large",
      initialQuantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it("createAddonSchema should accept valid addon", () => {
    const result = createAddonSchema.safeParse({
      name: "Extra Cheese",
      price: 2.0,
      maxSelectable: 3,
    });
    expect(result.success).toBe(true);
  });

  it("createImageSchema should accept valid image URL", () => {
    const result = createImageSchema.safeParse({
      url: "https://s3.amazonaws.com/bucket/pizza.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("createImageSchema should reject invalid URL", () => {
    const result = createImageSchema.safeParse({
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("updateInventorySchema should accept partial updates", () => {
    const result = updateInventorySchema.safeParse({ quantity: 100 });
    expect(result.success).toBe(true);
  });

  it("bulkImportSchema should accept valid batch", () => {
    const result = bulkImportSchema.safeParse({
      storeId: "123e4567-e89b-12d3-a456-426614174000",
      products: [
        { name: "Pizza", slug: "pizza", basePrice: 10 },
        { name: "Burger", slug: "burger", basePrice: 8 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("bulkImportSchema should reject empty products array", () => {
    const result = bulkImportSchema.safeParse({
      storeId: "123e4567-e89b-12d3-a456-426614174000",
      products: [],
    });
    expect(result.success).toBe(false);
  });

  it("moderateProductSchema should accept APPROVED", () => {
    const result = moderateProductSchema.safeParse({ status: "APPROVED" });
    expect(result.success).toBe(true);
  });

  it("moderateProductSchema should reject invalid status", () => {
    const result = moderateProductSchema.safeParse({ status: "PENDING" });
    expect(result.success).toBe(false);
  });
});
