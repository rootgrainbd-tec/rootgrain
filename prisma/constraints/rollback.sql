-- Constraints rollback script

ALTER TABLE "JournalEntry" DROP CONSTRAINT IF EXISTS "chk_journal_credit_positive";
ALTER TABLE "JournalEntry" DROP CONSTRAINT IF EXISTS "chk_journal_debit_positive";

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "chk_order_total_positive";
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "chk_order_subtotal_positive";

ALTER TABLE "Production" DROP CONSTRAINT IF EXISTS "chk_production_rejected_qty_positive";
ALTER TABLE "Production" DROP CONSTRAINT IF EXISTS "chk_production_completed_qty_positive";

ALTER TABLE "Inventory" DROP CONSTRAINT IF EXISTS "chk_inventory_allocated_qty_positive";
ALTER TABLE "Inventory" DROP CONSTRAINT IF EXISTS "chk_inventory_reserved_qty_positive";
ALTER TABLE "Inventory" DROP CONSTRAINT IF EXISTS "chk_inventory_qty_positive";
