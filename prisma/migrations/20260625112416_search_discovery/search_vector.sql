-- Add GIN index for full-text search on products
CREATE INDEX IF NOT EXISTS product_search_vector_idx ON "Product" USING GIN ("searchVector");

-- Auto-update searchVector on insert/update
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER product_search_vector_trigger
BEFORE INSERT OR UPDATE ON "Product"
FOR EACH ROW
EXECUTE FUNCTION update_product_search_vector();

-- Backfill existing products
UPDATE "Product" SET "searchVector" = to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''));
