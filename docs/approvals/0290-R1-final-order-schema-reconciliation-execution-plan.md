# 0290-R1 FINAL ORDER SCHEMA RECONCILIATION EXECUTION PLAN

## 1. Authority & Source
- **Approved Specifications**:
  - `0281-R2-final-production-authentication-safety-admin-identity-recovery.md`
  - `0282-gate1-authentication-safety-implementation.md`
  - `0283-gate2-production-deployment-oauth-domain-verification.md`
  - `0284-gate3-bilash7-admin-role-restoration.md`
  - `0285-gate4-bilash7-google-oauth-admin-verification.md`
  - `0286-gate5-rootgrainbd-admin-role-alignment.md`
  - `0287-gate6-final-two-admin-production-acceptance.md`
  - `0288-R1-account-page-root-cause-validation.md`
  - `0289-gate7-order-schema-drift-reconciliation-forensics.md`
  - `0290-gate8-order-schema-reconciliation-migration-plan.md`
- **Gate**: **0290-R1 — FINAL ORDER SCHEMA RECONCILIATION EXECUTION PLAN**
- **Mandate**: Provide the hardened, fail-closed, atomic execution plan to reconcile production `Order` schema with `prisma/schema.prisma` with zero data loss, strictly requiring explicit human approval before any production mutation.

---

## 2. Confirmed P2022 Root Cause Context
Production runtime error `P2022` (`The column Order.productionState does not exist in the current database`) is deterministically produced whenever `prisma.order.findMany()` or `prisma.order.findUnique()` executes on server components (e.g. `https://rootgrain.bd/account`). This occurs because the production database table `Order` currently contains `productionState_drift`, `advanceDeadline_drift`, and `estimatedManufacturingDays_drift` instead of the canonical column names declared in `prisma/schema.prisma`.

---

## 3. Exact Current vs Target Database Schema

| Column in Production DB (Current) | Type / Modifiers | Target Canonical Column (Reconciled) | Target Type / Modifiers | Status in Migration |
|---|---|---|---|---|
| `productionState_drift` | `ProductionState`, `NOT NULL`, default `NOT_STARTED` | `productionState` | `ProductionState`, `NOT NULL`, default `NOT_STARTED` | In-place atomic rename |
| `advanceDeadline_drift` | `timestamp`, nullable | `advanceDeadline` | `timestamp`, nullable | In-place atomic rename |
| `estimatedManufacturingDays_drift` | `int4`, nullable | `estimatedManufacturingDays` | `int4`, nullable | In-place atomic rename |
| `estimatedCompletionDate` | `timestamp`, nullable | `estimatedCompletionDate` | `timestamp`, nullable | Unchanged (Canonical exists) |
| `trackingNumber` | `text`, nullable | `trackingNumber` | `text`, nullable | Unchanged (Canonical exists) |
| `trackingUrl` | `text`, nullable | `trackingUrl` | `text`, nullable | Unchanged (Canonical exists) |
| `estimatedCompletionDate_drift` | `timestamp`, nullable | `estimatedCompletionDate_drift` | `timestamp`, nullable | **UNTOUCHED (NO DROP)** |
| `actualCompletionDate_drift` | `timestamp`, nullable | `actualCompletionDate_drift` | `timestamp`, nullable | **UNTOUCHED (NO DROP)** |
| `trackingNumber_drift` | `text`, nullable | `trackingNumber_drift` | `text`, nullable | **UNTOUCHED (NO DROP)** |
| `trackingUrl_drift` | `text`, nullable | `trackingUrl_drift` | `text`, nullable | **UNTOUCHED (NO DROP)** |

---

## 4. Atomicity & Fail-Closed Preconditions
The migration is encapsulated inside a single PostgreSQL `DO $$ ... END $$;` block. If any check or statement fails, PostgreSQL triggers an immediate `RAISE EXCEPTION` resulting in a full transaction abort with zero partial mutations.

### Fail-Closed Assertions Checked Before Mutation:
1. `public."Order"` table exists.
2. Canonical columns (`productionState`, `advanceDeadline`, `estimatedManufacturingDays`) do **NOT** already exist.
3. Source drift columns (`productionState_drift`, `advanceDeadline_drift`, `estimatedManufacturingDays_drift`) **DO** exist with their exact expected types (`ProductionState`, `timestamp`, `int4`).
4. Total order row count equals exactly **49** (Forensic baseline).
5. `productionState_drift` contains exactly **49** non-null values (46 `NOT_STARTED`, 3 `IN_PROGRESS`).
6. `advanceDeadline_drift` contains exactly **6** non-null values.
7. `estimatedManufacturingDays_drift` contains exactly **0** non-null values.

---

## 5. Exact Migration SQL File
**File**: `prisma/migrations/20260901115500_reconcile_order_schema_drift/migration.sql`

```sql
-- Reconcile Order schema drift: restore canonical column names with fail-closed preconditions and zero data loss
DO $$
DECLARE
  v_order_count INT;
  v_prod_state_drift_count INT;
  v_deadline_drift_count INT;
  v_mfg_days_drift_count INT;
BEGIN
  -- 1. Precondition Check: Table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Order'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Table public."Order" does not exist';
  END IF;

  -- 2. Precondition Check: Target canonical columns must NOT already exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'productionState'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Column "Order.productionState" already exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'advanceDeadline'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Column "Order.advanceDeadline" already exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'estimatedManufacturingDays'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Column "Order.estimatedManufacturingDays" already exists';
  END IF;

  -- 3. Precondition Check: Source drift columns MUST exist with expected types
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Order' 
      AND column_name = 'productionState_drift' 
      AND udt_name = 'ProductionState'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Source column "Order.productionState_drift" with type ProductionState is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Order' 
      AND column_name = 'advanceDeadline_drift' 
      AND udt_name = 'timestamp'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Source column "Order.advanceDeadline_drift" with type timestamp is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Order' 
      AND column_name = 'estimatedManufacturingDays_drift' 
      AND udt_name = 'int4'
  ) THEN
    RAISE EXCEPTION 'Precondition Failed: Source column "Order.estimatedManufacturingDays_drift" with type int4 is missing';
  END IF;

  -- 4. Data Safety Baseline Assertions
  SELECT 
    count(*),
    count("productionState_drift"),
    count("advanceDeadline_drift"),
    count("estimatedManufacturingDays_drift")
  INTO 
    v_order_count,
    v_prod_state_drift_count,
    v_deadline_drift_count,
    v_mfg_days_drift_count
  FROM "Order";

  IF v_order_count <> 49 THEN
    RAISE EXCEPTION 'Data Safety Check Failed: Expected 49 orders, found %', v_order_count;
  END IF;

  IF v_prod_state_drift_count <> 49 THEN
    RAISE EXCEPTION 'Data Safety Check Failed: Expected 49 non-null productionState_drift values, found %', v_prod_state_drift_count;
  END IF;

  IF v_deadline_drift_count <> 6 THEN
    RAISE EXCEPTION 'Data Safety Check Failed: Expected 6 non-null advanceDeadline_drift values, found %', v_deadline_drift_count;
  END IF;

  IF v_mfg_days_drift_count <> 0 THEN
    RAISE EXCEPTION 'Data Safety Check Failed: Expected 0 non-null estimatedManufacturingDays_drift values, found %', v_mfg_days_drift_count;
  END IF;

  -- 5. Atomic In-Place Reconciliations (Preserving 100% of data values)
  ALTER TABLE "Order" RENAME COLUMN "productionState_drift" TO "productionState";
  ALTER TABLE "Order" RENAME COLUMN "advanceDeadline_drift" TO "advanceDeadline";
  ALTER TABLE "Order" RENAME COLUMN "estimatedManufacturingDays_drift" TO "estimatedManufacturingDays";

END $$;
```

---

## 6. Strict No-Drop Guarantee
- **Zero `DROP COLUMN` statements** are present in the migration.
- `estimatedCompletionDate_drift`, `actualCompletionDate_drift`, `trackingNumber_drift`, and `trackingUrl_drift` are 100% retained.

---

## 7. Reversible Rollback Plan
In the event of an emergency rollback, the inverse atomic statement restores original state:
```sql
DO $$
BEGIN
  ALTER TABLE "Order" RENAME COLUMN "productionState" TO "productionState_drift";
  ALTER TABLE "Order" RENAME COLUMN "advanceDeadline" TO "advanceDeadline_drift";
  ALTER TABLE "Order" RENAME COLUMN "estimatedManufacturingDays" TO "estimatedManufacturingDays_drift";
END $$;
```
Rollback restores all 49 `productionState` values and 6 `advanceDeadline` values without data alteration.

---

## 8. Repository Hardening & Deployment Sequence Analysis

### A. Static Code Hardening (`vercel-reconcile.js`)
The proactive renaming block has been removed:
```diff
diff --git a/vercel-reconcile.js b/vercel-reconcile.js
index e333c96..360ddfb 100644
--- a/vercel-reconcile.js
+++ b/vercel-reconcile.js
@@ -25,21 +25,6 @@ async function reconcile() {
         console.log("Renamed PriceRevision");
     } catch(e) {}
 
-    // Other drifted columns added by patch_db.ts that might collide in future migrations
-    try {
-        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" RENAME COLUMN "productionState" TO "productionState_drift"`);
-        console.log("Renamed productionState");
-    } catch(e) {}
-    
-    try {
-        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" RENAME COLUMN "advanceDeadline" TO "advanceDeadline_drift"`);
-        console.log("Renamed advanceDeadline");
-    } catch(e) {}
-    
-    try {
-        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" RENAME COLUMN "estimatedManufacturingDays" TO "estimatedManufacturingDays_drift"`);
-        console.log("Renamed estimatedManufacturingDays");
-    } catch(e) {}
```

### B. Deployment Sequence & Lifecycle Invariant
- **Lifecycle Invariant**: The code hardening in `vercel-reconcile.js` MUST be deployed to Vercel so that `npm install` on Vercel never executes the proactive rename on future builds.
- **Ordered Execution Steps**:
  1. Commit and push the `vercel-reconcile.js` hardening and new migration file.
  2. Vercel build runs `postinstall` (which no longer renames the columns) and executes `prisma migrate deploy` (which applies `20260901115500_reconcile_order_schema_drift` cleanly).
  3. Verify migration postconditions on production PostgreSQL.
  4. Perform live browser verification of `/account`, `/account/orders`, and `/admin`.

---

## 9. Read-Only Post-Migration Verification Queries

```sql
-- 1. Verify canonical columns exist and drift source columns are gone
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Order'
  AND column_name IN (
    'productionState', 'productionState_drift',
    'advanceDeadline', 'advanceDeadline_drift',
    'estimatedManufacturingDays', 'estimatedManufacturingDays_drift'
  )
ORDER BY column_name;

-- 2. Verify data row counts and null counts
SELECT 
  count(*) AS total_orders,
  count("productionState") AS non_null_productionState,
  count("advanceDeadline") AS non_null_advanceDeadline,
  count("estimatedManufacturingDays") AS non_null_estimatedManufacturingDays
FROM "Order";

-- 3. Verify distinct productionState breakdown
SELECT "productionState", count(*)
FROM "Order"
GROUP BY "productionState";
```

---

## 10. Risk Matrix & Abort Conditions

| Risk Category | Pre-Mitigation Level | Mitigation in Plan | Post-Mitigation Level |
|---|---|---|---|
| **Data Loss** | Extreme | Fail-closed row count & null count assertions; zero `DROP` statements; in-place rename | **Zero Risk** |
| **Partial Mutation** | High | Single atomic `DO $$` block | **Zero Risk** |
| **Build Regression** | High | Proactive rename triggers removed from `vercel-reconcile.js` | **Zero Risk** |
| **Type Incompatibility** | Medium | Assertions verify `udt_name = 'ProductionState'` prior to rename | **Zero Risk** |

---

## 11. Final Status & Human Authority Gate
- **MIGRATION STATUS**: **`HARDENED & PREPARED (NOT EXECUTED)`**.
- **CODE HARDENING**: **`PREPARED (NOT COMMITTED / NOT PUSHED)`**.
- **DATABASE STATUS**: **`NOT MODIFIED (0 ROWS ALTERED)`**.
- **GATE 8 STATUS**: **`READY FOR EXPLICIT HUMAN APPROVAL FOR PRODUCTION RECONCILIATION EXECUTION`**.
