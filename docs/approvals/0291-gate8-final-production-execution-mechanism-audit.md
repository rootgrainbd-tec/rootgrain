# 0291 GATE 8 FINAL PRODUCTION EXECUTION MECHANISM AUDIT

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
  - `0290-R1-final-order-schema-reconciliation-execution-plan.md`
- **Gate**: **GATE 8 — FINAL PRODUCTION EXECUTION MECHANISM AUDIT**
- **Mandate**: Perform a strict read-only audit of the repository and Vercel production deployment lifecycle to document exactly how the prepared Prisma migration and code hardening will be applied to production with zero unintended database mutations.

---

## 2. Repository & package.json Lifecycle Audit

### `package.json` Configuration
```json
{
  "scripts": {
    "build": "if [ \"$VERCEL_ENV\" = \"production\" ]; then npx prisma migrate deploy; fi && next build",
    "postinstall": "node vercel-reconcile.js && npx prisma migrate resolve --rolled-back 20260829032733_phase6_qc_schema_foundation && prisma generate"
  }
}
```

### `vercel.json` Configuration
```json
{
  "buildCommand": "if [ \"$VERCEL_ENV\" = \"production\" ]; then npx prisma migrate deploy; fi && npm run build"
}
```

### `prisma/schema.prisma` Datasource
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## 3. Vercel Build & Database Mutation Flow
When a release commit is pushed to `origin/main`, Vercel initiates the following sequential lifecycle:

```
[ Git Push to origin/main ]
           │
           ▼
1. Vercel Build Step: npm install
   └── Executes postinstall:
       ├── node vercel-reconcile.js  (Hardened: No longer renames canonical columns)
       ├── npx prisma migrate resolve --rolled-back ...
       └── prisma generate
           │
           ▼
2. Vercel Build Step: buildCommand
   └── Evaluates: if [ "$VERCEL_ENV" = "production" ]; then npx prisma migrate deploy; fi
       └── Connects via DIRECT_URL (Port 5432 Direct PostgreSQL session connection)
       └── Evaluates prisma/migrations/
       └── Discovers unapplied migration: 20260901115500_reconcile_order_schema_drift
       └── Executes DO $$ block with fail-closed assertions:
           ├── Checks Order table exists
           ├── Checks canonical columns do NOT exist
           ├── Checks drift columns DO exist with exact types
           ├── Checks data counts (49 orders, 49 productionState, 6 advanceDeadline)
           └── Executes atomic in-place RENAME statements
       └── Inserts record into public._prisma_migrations upon COMMIT
           │
           ▼
3. Vercel Compile Step: npm run build (next build)
   └── Compiles Next.js Server & Client components against updated schema
           │
           ▼
4. Vercel Deployment Step: Ready
   └── Serves updated application bundle to https://rootgrain.bd
```

---

## 4. Code & Database Coupling Analysis
- **Automatic Production DB Mutation**: **`CONFIRMED`** on Vercel production build via `buildCommand`.
- **Safety Evaluation**: Because `vercel.json` and `package.json` invoke `npx prisma migrate deploy` during the build phase, pushing the new migration directory `prisma/migrations/20260901115500_reconcile_order_schema_drift/` alongside the `vercel-reconcile.js` hardening triggers the migration automatically in the exact correct order:
  1. `postinstall` runs first using the *new* `vercel-reconcile.js` (preventing any proactive drift).
  2. `buildCommand` runs second (applying the reconciliation migration).
  3. `next build` runs third (building against the reconciled schema).
- **In-flight Safety**: The migration is guarded with fail-closed assertions. If any row count or column type diverges, the migration raises an exception, aborting the build before deployment.

---

## 5. Rollback Separation (Code vs Database)
- **Critical Invariant**: Reverting a Git commit on Vercel or promoting a prior deployment rolls back the Next.js runtime artifact, but **DOES NOT** roll back the PostgreSQL database schema.
- **Database Rollback Procedure**: If an emergency database rollback is ever required, it must be executed explicitly via SQL:
  ```sql
  DO $$
  BEGIN
    ALTER TABLE "Order" RENAME COLUMN "productionState" TO "productionState_drift";
    ALTER TABLE "Order" RENAME COLUMN "advanceDeadline" TO "advanceDeadline_drift";
    ALTER TABLE "Order" RENAME COLUMN "estimatedManufacturingDays" TO "estimatedManufacturingDays_drift";
  END $$;
  ```

---

## 6. Execution Options Comparison

| Dimension | Option A: Push + Vercel Deployment Pipeline | Option B: Manual CLI Migration then Push |
|---|---|---|
| **Mechanism** | Git commit + push to `main`; Vercel runs `postinstall` + `prisma migrate deploy` | Run migration via CLI first, then push commit |
| **Migration History** | Automatically recorded in `_prisma_migrations` via Prisma engine | Requires local direct DB connection string |
| **Risk of Drift Reintroduction** | **Zero** (`vercel-reconcile.js` is updated in the same commit) | High (If pushed separately, old `vercel-reconcile.js` could run) |
| **Atomicity** | Guaranteed via `DO $$` block | Guaranteed via `DO $$` block |
| **Human Authority Control** | Single approval gate for atomic release | Two separate approval checkpoints |

---

## 7. Recommended Execution Path
**OPTION A (Unified Atomic Release via Git Commit & Push)** is recommended because:
1. It guarantees that `vercel-reconcile.js` hardening is active in `postinstall` *before* `prisma migrate deploy` runs.
2. It ensures `public._prisma_migrations` is updated natively by the Prisma engine on Vercel.
3. It prevents any window where the database schema and application code are desynchronized.

---

## 8. Exact Change Manifest (Pre-Execution Review)
- **Modified**: [vercel-reconcile.js](file:///d:/rootgrain%20website/_extracted/vercel-reconcile.js) (Removed lines 28–43).
- **Added**: `prisma/migrations/20260901115500_reconcile_order_schema_drift/migration.sql` (Hardened atomic PL/pgSQL block).
- **Created Documentation**: `docs/approvals/0290-R1-final-order-schema-reconciliation-execution-plan.md`, `docs/approvals/0291-gate8-final-production-execution-mechanism-audit.md`.

---

## 9. Final Status & Human Authority Gate
- **MIGRATION SQL**: **APPROVED & HARDENED**.
- **DATA SAFETY**: **APPROVED (100% PRESERVED & ASSERTED)**.
- **EXECUTION MECHANISM**: **SAFE & AUDITED**.
- **DATABASE STATUS**: **NOT MODIFIED (0 MUTATIONS EXECUTED)**.
- **FINAL STATUS**: **`READY FOR EXPLICIT HUMAN APPROVAL TO COMMIT, PUSH, AND EXECUTE PRODUCTION DEPLOYMENT`**.
