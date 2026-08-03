-- Indexes migration script to satisfy lookup rules

-- Resource
CREATE UNIQUE INDEX "idx_resource_sku_unique" ON "Resource"("sku");
CREATE UNIQUE INDEX "idx_resource_slug_unique" ON "Resource"("slug");
CREATE INDEX "idx_resource_status" ON "Resource"("status");
CREATE INDEX "idx_resource_created_at" ON "Resource"("created_at");

-- Production
CREATE UNIQUE INDEX "idx_production_batch_id_unique" ON "Production"("batch_id");

-- Orders
CREATE UNIQUE INDEX "idx_order_number_unique" ON "Order"("order_number");
CREATE INDEX "idx_order_customer_id" ON "Order"("customer_id");

-- Accounting
CREATE UNIQUE INDEX "idx_invoice_number_unique" ON "Invoice"("invoice_number");
