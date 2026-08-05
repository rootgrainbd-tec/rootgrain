-- Constraints migration script establishing strict database-level mathematical rules

-- Inventory constraints
ALTER TABLE "Inventory" ADD CONSTRAINT "chk_inventory_qty_positive" CHECK ("quantity" >= 0);
ALTER TABLE "Inventory" ADD CONSTRAINT "chk_inventory_reserved_qty_positive" CHECK ("reserved_quantity" >= 0);
ALTER TABLE "Inventory" ADD CONSTRAINT "chk_inventory_allocated_qty_positive" CHECK ("allocated_quantity" >= 0);

-- Production constraints
ALTER TABLE "Production" ADD CONSTRAINT "chk_production_completed_qty_positive" CHECK ("completed_quantity" >= 0);
ALTER TABLE "Production" ADD CONSTRAINT "chk_production_rejected_qty_positive" CHECK ("rejected_quantity" >= 0);

-- Order constraints
ALTER TABLE "Order" ADD CONSTRAINT "chk_order_subtotal_positive" CHECK ("subtotal" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "chk_order_total_positive" CHECK ("total" >= 0);

-- Accounting constraints
ALTER TABLE "JournalEntry" ADD CONSTRAINT "chk_journal_debit_positive" CHECK ("debit" >= 0);
ALTER TABLE "JournalEntry" ADD CONSTRAINT "chk_journal_credit_positive" CHECK ("credit" >= 0);
