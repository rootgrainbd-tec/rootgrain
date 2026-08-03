-- Indexes rollback script

DROP INDEX IF EXISTS "idx_invoice_number_unique";

DROP INDEX IF EXISTS "idx_order_customer_id";
DROP INDEX IF EXISTS "idx_order_number_unique";

DROP INDEX IF EXISTS "idx_production_batch_id_unique";

DROP INDEX IF EXISTS "idx_resource_created_at";
DROP INDEX IF EXISTS "idx_resource_status";
DROP INDEX IF EXISTS "idx_resource_slug_unique";
DROP INDEX IF EXISTS "idx_resource_sku_unique";
