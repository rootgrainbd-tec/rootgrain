# 0289 GATE 7 PRODUCTION ORDER SCHEMA DRIFT RECONCILIATION FORENSICS

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
- **Gate**: **GATE 7 — PRODUCTION ORDER SCHEMA DRIFT RECONCILIATION FORENSICS**
- **Mandate**: Perform strict read-only forensic analysis of the `Order` table schema drift in production PostgreSQL without executing any mutations.

---

## 2. Confirmed P2022 Error Context
As validated in `0288-R1`, whenever `prisma.order.findMany()` or `prisma.order.findUnique()` executes on server components (such as `https://rootgrain.bd/account`), Prisma requests the scalar field `Order.productionState`. PostgreSQL rejects the query with:
```text
PrismaClientKnownRequestError [P2022]: 
The column `Order.productionState` does not exist in the current database.
```

---

## 3. Prisma Order Schema (`prisma/schema.prisma`)
The relevant fields declared in `model Order` are:

| Field Name | Type | Modifiers / Default | Description |
|---|---|---|---|
| `productionState` | `ProductionState` | `@default(NOT_STARTED)` (NOT NULL) | Production state enum (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETE`) |
| `advanceDeadline` | `DateTime?` | Optional (NULL) | Deadline for advance payment |
| `estimatedManufacturingDays` | `Int?` | Optional (NULL) | Estimated days in manufacturing |
| `estimatedCompletionDate` | `DateTime?` | Optional (NULL) | Estimated completion date |
| `trackingNumber` | `String?` | Optional (NULL) | Shipment tracking number |
| `trackingUrl` | `String?` | Optional (NULL) | Shipment tracking URL |

---

## 4. Production Database Column Inventory (`information_schema.columns`)
Direct query of `public."Order"` on production PostgreSQL (`17.6.1.121` on `db.dwotbplepjcnydxhodwj.supabase.co`) returned:

| Column Name | Data Type | UDT Name | Nullable | Column Default |
|---|---|---|---|---|
| `productionState_drift` | `USER-DEFINED` | `ProductionState` | `NO` | `'NOT_STARTED'::"ProductionState"` |
| `advanceDeadline_drift` | `timestamp without time zone` | `timestamp` | `YES` | `NULL` |
| `estimatedManufacturingDays_drift` | `integer` | `int4` | `YES` | `NULL` |
| `estimatedCompletionDate_drift` | `timestamp without time zone` | `timestamp` | `YES` | `NULL` |
| `actualCompletionDate_drift` | `timestamp without time zone` | `timestamp` | `YES` | `NULL` |
| `trackingNumber_drift` | `text` | `text` | `YES` | `NULL` |
| `trackingUrl_drift` | `text` | `text` | `YES` | `NULL` |
| `estimatedCompletionDate` | `timestamp without time zone` | `timestamp` | `YES` | `NULL` |
| `trackingNumber` | `text` | `text` | `YES` | `NULL` |
| `trackingUrl` | `text` | `text` | `YES` | `NULL` |

**Key Finding**:
- Canonical `productionState` **DOES NOT EXIST** (only `productionState_drift` exists).
- Canonical `advanceDeadline` **DOES NOT EXIST** (only `advanceDeadline_drift` exists).
- Canonical `estimatedManufacturingDays` **DOES NOT EXIST** (only `estimatedManufacturingDays_drift` exists).
- Canonical `estimatedCompletionDate`, `trackingNumber`, `trackingUrl` exist alongside empty `*_drift` duplicates.

---

## 5. Data Presence in Production (`Order` Table)
Direct query across all 49 production orders revealed:

| Field Name | Total Rows | Non-Null Rows | Null Rows | Distinct Values / Range |
|---|---|---|---|---|
| `productionState_drift` | 49 | **49** (100%) | 0 | `NOT_STARTED`: 46 rows, `IN_PROGRESS`: 3 rows |
| `advanceDeadline_drift` | 49 | **6** | 43 | `2026-08-27 08:53:43` to `2026-08-27 09:04:10` |
| `estimatedManufacturingDays_drift` | 49 | 0 | 49 | `NULL` |
| `estimatedCompletionDate_drift` | 49 | 0 | 49 | `NULL` |
| `actualCompletionDate_drift` | 49 | 0 | 49 | `NULL` |
| `trackingNumber_drift` | 49 | 0 | 49 | `NULL` |
| `trackingUrl_drift` | 49 | 0 | 49 | `NULL` |
| `estimatedCompletionDate` (Canonical) | 49 | 0 | 49 | `NULL` |
| `trackingNumber` (Canonical) | 49 | 0 | 49 | `NULL` |
| `trackingUrl` (Canonical) | 49 | 0 | 49 | `NULL` |

---

## 6. Root Cause & Historical Origin of Drift
1. In `vercel-reconcile.js` (executed during `postinstall` on Vercel builds), proactive `ALTER TABLE "Order" RENAME COLUMN ... TO "..._drift"` statements were added to prevent migration collisions.
2. Migration `20260823000000_phase6_mto_schema` was already marked applied in `_prisma_migrations`, so subsequent migrations never recreated the canonical columns.
3. As a result, `productionState_drift` holds active production order states (`46 NOT_STARTED`, `3 IN_PROGRESS`), but the canonical column `productionState` expected by Prisma Client is missing, causing `P2022`.

---

## 7. Database Object Dependencies
- **Foreign Keys**: Only `Order_userId_fkey` (`userId -> User.id`). Zero foreign keys on drift columns.
- **Indexes**: `Order_pkey`, `Order_orderNumber_key`, `Order_userId_idx`, `Order_status_idx`, `Order_createdAt_idx`, `Order_guestTokenHash_key`. Zero indexes on drift columns.
- **PostgreSQL Enum**: Type `ProductionState` exists natively in PostgreSQL with values (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETE`). The column `productionState_drift` already has the exact compatible enum type.

---

## 8. Historical Data Safety & Data Loss Risk
- `productionState_drift` holds **CRITICAL BUSINESS DATA** for 49 orders (including 3 active `IN_PROGRESS` orders).
- `advanceDeadline_drift` holds active deadlines for 6 orders.
- **Data Loss Risk of Dropping Drift Columns**: **`EXTREME / UNACCEPTABLE`**.
- **Data Loss Risk of In-Place Rename (`*_drift -> canonical`)**: **`ZERO`** (100% atomic, zero-copy, non-destructive).

---

## 9. Application Usage Scope
`productionState` is actively used in:
1. `src/app/(storefront)/account/page.tsx` (Customer Account Overview)
2. `src/app/(storefront)/account/orders/page.tsx` (Customer Order History)
3. `src/services/payment.service.ts` (Payment & advance revision validations)
4. `src/services/mto-admin.service.ts` (MTO production lifecycle: start, complete, dispatch)
5. `src/app/(storefront)/admin/orders/[id]/MtoManagement.tsx` (Admin MTO UI)
6. `src/app/(storefront)/admin/orders/[id]/DispatchManager.tsx` (Admin Dispatch UI)

All these features are directly impacted by the missing `Order.productionState` column.

---

## 10. Reconciliation Options Analysis

| Option | Strategy | Data Safety | Compatibility | Complexity | Risk |
|---|---|---|---|---|---|
| **Option A (Recommended)** | **In-Place Atomic Column Rename (`*_drift -> canonical`) + Cleanup `vercel-reconcile.js`** | **100% Preserved** | **100% Aligned** | Low (Single SQL transaction) | Minimal / Reversible |
| **Option B** | Modify `prisma/schema.prisma` with `@map` | Preserved | High technical debt | Medium | High (Schema divergence) |
| **Option C** | Create new canonical columns and `UPDATE` copy | High | Redundant duplicate columns | High | Medium (Unnecessary copy) |
| **Option D** | Fresh Migration Re-run | Data loss risk | Complex | Very High | Severe |

---

## 11. Proposed Reconciliation Blueprint (For Next Gate)

### Phase 1: Database Atomic Rename (Execution Plan)
```sql
BEGIN;

-- 1. Rename columns with business data to canonical names
ALTER TABLE "Order" RENAME COLUMN "productionState_drift" TO "productionState";
ALTER TABLE "Order" RENAME COLUMN "advanceDeadline_drift" TO "advanceDeadline";
ALTER TABLE "Order" RENAME COLUMN "estimatedManufacturingDays_drift" TO "estimatedManufacturingDays";

-- 2. Drop empty redundant duplicate drift columns where canonical already exists
ALTER TABLE "Order" DROP COLUMN IF EXISTS "estimatedCompletionDate_drift";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "actualCompletionDate_drift";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "trackingNumber_drift";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "trackingUrl_drift";

COMMIT;
```

### Phase 2: Repository Code Hardening
- Remove the destructive renaming blocks from `vercel-reconcile.js` so subsequent deployments do not recreate the drift.

---

## 12. Rollback Plan
If needed, inverse rollback is instant:
```sql
ALTER TABLE "Order" RENAME COLUMN "productionState" TO "productionState_drift";
ALTER TABLE "Order" RENAME COLUMN "advanceDeadline" TO "advanceDeadline_drift";
ALTER TABLE "Order" RENAME COLUMN "estimatedManufacturingDays" TO "estimatedManufacturingDays_drift";
```

---

## 13. Final Classification & Gate Status
- **ROOT CAUSE**: **`CONFIRMED — P2022 SCHEMA DRIFT (Order.productionState renamed to productionState_drift)`**.
- **DATA PRESERVATION**: **`100% PRESERVED & IDENTIFIED`**.
- **RECOMMENDED ACTION**: **`EXECUTE OPTION A RECONCILIATION UNDER CHANGE CONTROL APPROVAL`**.
- **GATE 7 STATUS**: **`FORENSICS COMPLETE / READY FOR RECONCILIATION APPROVAL`**.
