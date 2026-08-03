-- Baseline rollback script (executes in reverse table order to handle FKs if applied)

DROP TABLE IF EXISTS "Report";
DROP TABLE IF EXISTS "JournalEntry";
DROP TABLE IF EXISTS "Invoice";
DROP TABLE IF EXISTS "Order";
DROP TABLE IF EXISTS "Production";
DROP TABLE IF EXISTS "Inventory";
DROP TABLE IF EXISTS "Resource";
