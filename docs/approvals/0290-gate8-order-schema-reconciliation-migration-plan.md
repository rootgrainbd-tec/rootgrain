# 0290 GATE 8 ORDER SCHEMA RECONCILIATION MIGRATION PLAN

## 1. Authority
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
- **Gate**: **GATE 8 — ORDER SCHEMA RECONCILIATION MIGRATION PREPARATION**
- **Mandate**: Prepare the exact, atomic, zero-data-loss migration and repository hardening required to reconcile production PostgreSQL `Order` table schema with `prisma/schema.prisma` without executing any production mutations.

---

## 2. Confirmed Root Cause Context
Production runtime error `P2022` (`The column Order.productionState does not exist in the current database`) is caused by proactive column renaming in `vercel-reconcile.js` (`postinstall` hook) which renamed `productionState -> productionState_drift`, `advanceDeadline -> advanceDeadline_drift`, and `estimatedManufacturingDays -> estimatedManufacturingDays_drift`.

---

## 3. Current Production State & Critical Data Inventory
- **Total Orders**: `49`
- **`productionState_drift`**: `49` non-null rows (46 `NOT_STARTED`, 3 `IN_PROGRESS`). Canonical column absent in DB.
- **`advanceDeadline_drift`**: `6` non-null rows. Canonical column absent in DB.
- **`estimatedManufacturingDays_drift`**: `0` non-null rows (all 49 null). Canonical column absent in DB.
- **Untouched Drift Columns**: `estimatedCompletionDate_drift`, `actualCompletionDate_drift`, `trackingNumber_drift`, `trackingUrl_drift` (strictly retained without DROP).

---

## 4. Proposed Migration Blueprint

### Migration File Location
`prisma/migrations/20260901115500_reconcile_order_schema_drift/migration.sql`

### Exact Forward SQL
```sql
-- Reconcile Order schema drift: restore canonical column names with zero data loss
ALTER TABLE "Order" RENAME COLUMN "productionState_drift" TO "productionState";
ALTER TABLE "Order" RENAME COLUMN "advanceDeadline_drift" TO "advanceDeadline";
ALTER TABLE "Order" RENAME COLUMN "estimatedManufacturingDays_drift" TO "estimatedManufacturingDays";
```

---

## 5. Preconditions & Postconditions

### Preconditions (Checked Before Execution)
1. `productionState_drift` exists in `Order` table with type `ProductionState`.
2. `advanceDeadline_drift` exists in `Order` table with type `timestamp`.
3. `estimatedManufacturingDays_drift` exists in `Order` table with type `integer`.
4. Total order row count equals exactly `49`.

### Postconditions (Verified Immediately After Execution)
1. `productionState` exists in `Order` table (`49` non-null rows: 46 `NOT_STARTED`, 3 `IN_PROGRESS`).
2. `advanceDeadline` exists in `Order` table (`6` non-null rows).
3. `estimatedManufacturingDays` exists in `Order` table (`0` non-null rows).
4. `productionState_drift`, `advanceDeadline_drift`, `estimatedManufacturingDays_drift` no longer exist.
5. Total order row count remains exactly `49`.
6. Zero orders deleted, mutated, or lost.

---

## 6. Reversible Rollback Plan
If rollback is required, the inverse atomic statement restores original state:
```sql
ALTER TABLE "Order" RENAME COLUMN "productionState" TO "productionState_drift";
ALTER TABLE "Order" RENAME COLUMN "advanceDeadline" TO "advanceDeadline_drift";
ALTER TABLE "Order" RENAME COLUMN "estimatedManufacturingDays" TO "estimatedManufacturingDays_drift";
```
Rollback preserves 100% of data values (49 productionState values and 6 advanceDeadline values).

---

## 7. Type Safety & Constraint Safety
- **Type Safety**:
  - `productionState`: Preserves `ProductionState` enum, `NOT NULL`, default `'NOT_STARTED'::"ProductionState"`.
  - `advanceDeadline`: Preserves `timestamp without time zone`, nullable, default `NULL`.
  - `estimatedManufacturingDays`: Preserves `int4`, nullable, default `NULL`.
- **Constraint Safety**:
  - Zero foreign keys or indexes exist on the renamed columns. No constraints dropped or recreated.

---

## 8. Repository Hardening: `vercel-reconcile.js`
The proactive renaming block in `vercel-reconcile.js` that caused the drift has been cleanly removed:
```diff
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
This ensures future Vercel builds do not re-introduce the schema drift upon `npm install`.

---

## 9. Read-Only Post-Migration Verification Queries

```sql
-- 1. Verify canonical columns exist and drift source columns are gone
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Order'
  AND column_name IN (
    'productionState', 'productionState_drift',
    'advanceDeadline', 'advanceDeadline_drift',
    'estimatedManufacturingDays', 'estimatedManufacturingDays_drift'
  );

-- 2. Verify data counts and integrity
SELECT 
  count(*) AS total_orders,
  count("productionState") AS non_null_productionState,
  count("advanceDeadline") AS non_null_advanceDeadline,
  count("estimatedManufacturingDays") AS non_null_estimatedManufacturingDays
FROM "Order";

-- 3. Verify distinct state breakdown
SELECT "productionState", count(*)
FROM "Order"
GROUP BY "productionState";
```

---

## 10. Application Compatibility
Restoring canonical column names enables:
1. `https://rootgrain.bd/account` (Customer Account Overview) -> `HTTP 200`
2. `https://rootgrain.bd/account/orders` (Customer Order History) -> `HTTP 200`
3. `src/services/payment.service.ts` (Advance Payment Revision) -> Fully functional
4. `src/services/mto-admin.service.ts` (MTO Production State Workflow) -> Fully functional
5. `src/app/(storefront)/admin/orders/[id]/MtoManagement.tsx` (Admin MTO UI) -> Fully functional

---

## 11. Final Status & Execution Approval Gate
- **Migration File**: `prisma/migrations/20260901115500_reconcile_order_schema_drift/migration.sql` (Created).
- **Code Patch**: `vercel-reconcile.js` (Prepared).
- **Database Status**: **NOT MODIFIED** (Strict preparation phase).
- **GATE 8 STATUS**: **`PREPARED / AWAITING EXPLICIT HUMAN APPROVAL FOR EXECUTION`**.
