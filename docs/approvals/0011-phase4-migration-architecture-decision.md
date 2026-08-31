# 0011-PHASE4-MIGRATION-ARCHITECTURE-DECISION

**Document:** docs/approvals/0011-phase4-migration-architecture-decision.md
**Status:** AWAITING APPROVAL

## 1. AUTHORITATIVE BASIS
This architecture decision is strictly based on:
1. `docs/approvals/0008-phase3-repository-data-architecture-mapping.md`
2. `docs/approvals/0009-phase4-database-transaction-foundation.md`
3. `docs/approvals/0010-phase4-implementation-preflight.md`
4. Latest Slice 1 forensic audit
5. Current repository evidence already gathered during the forensic audit

## 2. CORE ARCHITECTURE DECISION
**OPTION A**

PRISMA = AUTHORITY FOR ROOTGRAIN APPLICATION SCHEMA
SUPABASE = VERIFIED INFRASTRUCTURE / LOCAL ENVIRONMENT RESPONSIBILITIES

## 3. OBJECT-LEVEL OWNERSHIP
**ONE DATABASE OBJECT = ONE MIGRATION AUTHORITY**

No application database object may be independently managed by both Prisma and Supabase migrations.

ROOTGRAIN APPLICATION-OWNED OBJECTS include, where verified:
- Order
- OrderItem
- PaymentRecord
- OrderEvent
- OrderDocument
- NotificationOutbox
- IdempotencyKey
- application-owned enums
- application-owned indexes
- application-owned foreign keys
- application-owned constraints
- future RootGrain application models

These MUST be managed through Prisma migrations.

## 4. PRISMA AUTHORITY
Prisma is the sole migration authority for ROOTGRAIN APPLICATION-OWNED DATABASE OBJECTS.

This includes:
- application tables
- application enums
- application indexes
- application foreign keys
- application constraints
- application schema changes

Production/staging application-schema changes MUST use reviewed Prisma migration files.

## 5. db:push SAFETY RULE
`prisma db push` MUST NOT be used as the controlled production/staging application-schema deployment mechanism.

Production/staging schema changes MUST use:
Prisma migration files + reviewed migration deployment.

`db:push` may only be used where explicitly permitted by the repository's development workflow and MUST NOT bypass migration governance.

## 6. SUPABASE ROLE
Supabase MUST NOT be described as the application schema migration authority.

Supabase may remain responsible for repository-verified responsibilities such as:
- local Supabase/PostgreSQL orchestration
- Supabase Auth baseline
- required infrastructure/extensions
- verified local bootstrap responsibilities
- development-only seed/bootstrap behavior where actually supported

## 7. INFRASTRUCTURE vs SEED vs APPLICATION MIGRATION
A. **INFRASTRUCTURE / PLATFORM BASELINE**
Examples only where verified:
- Supabase/Auth baseline
- required extensions
- local platform bootstrap

B. **DEVELOPMENT SEED**
Development-only data/bootstrap. Seed data MUST NOT be confused with schema ownership.

C. **APPLICATION SCHEMA MIGRATION**
Examples:
- Order
- PaymentRecord
- OrderItem
- OrderEvent
- OrderDocument
- NotificationOutbox
- IdempotencyKey

Application schema migration belongs to Prisma.

## 8. SUPABASE PHASE4.SQL
The repository contains: `supabase/migrations/20260522000002_phase4.sql`

This file overlaps with application-schema responsibilities and is classified as:
**RETIRED / SUPERSEDED APPLICATION-SCHEMA MIGRATION**

Historical preservation ≠ active migration authority. This historical file is preserved until an explicit implementation/remediation decision authorizes its archival/removal treatment.

## 9. HISTORICAL SUPABASE FILES
The following files:
- `supabase/migrations/20260522000000_init.sql`
- `supabase/migrations/20260522000001_seed.sql`
- `supabase/migrations/20260522000002_phase4.sql`

These files are historical repository artifacts and MUST NOT be deleted or modified without explicit approval. 

## 10. DUAL-AUTHORITY PROHIBITION
NO ROOTGRAIN APPLICATION DATABASE OBJECT may be simultaneously governed by:
Prisma migrations AND Supabase migrations.

This includes: tables, enums, indexes, foreign keys, constraints.

If overlap is discovered: STOP. Do NOT resolve it silently. Create an approval document describing the conflicting objects, evidence, current owners, proposed owner, migration risk, and remediation plan. WAIT FOR APPROVAL.

## 11. CLEAN-ENVIRONMENT BOOTSTRAP CONTRACT
**TARGET BOOTSTRAP CONTRACT:**
CLEAN ENVIRONMENT
        ↓
SUPABASE INFRASTRUCTURE / REQUIRED BASELINE
        ↓
PRISMA APPLICATION SCHEMA MIGRATIONS
        ↓
PRISMA CLIENT GENERATION
        ↓
APPLICATION TESTS

**BOOTSTRAP ORDER: REQUIRES IMPLEMENTATION-LEVEL VERIFICATION**

## 12. BOOTSTRAP ACCEPTANCE TEST
After explicit architecture approval, implementation must verify from a clean local environment:
1. Supabase local environment starts.
2. Required Supabase infrastructure exists.
3. Supabase bootstrap does NOT independently create/alter RootGrain application schema objects owned by Prisma.
4. Prisma migration deployment succeeds.
5. Prisma application schema is created correctly.
6. Prisma Client generation succeeds.
7. Application tests succeed for the verified environment.

If any step fails: STOP. Create an approval document if architecture needs to change.

## 13. MIGRATION AUTHORITY MATRIX

| Object Category | Authority |
|---|---|
| RootGrain application tables | Prisma |
| RootGrain application enums | Prisma |
| RootGrain application indexes | Prisma |
| RootGrain application FKs | Prisma |
| RootGrain application constraints | Prisma |
| Supabase/Auth infrastructure | Supabase / verified platform mechanism |
| Required platform extensions | Supabase / verified platform mechanism |
| Development seed data | Verified seed mechanism |
| Unknown/unverified object | NOT VERIFIED — STOP |

## 14. MIGRATION FILE POLICY
ACTIVE application schema migrations: Prisma
RETIRED historical application migration: `supabase/migrations/20260522000002_phase4.sql`
Historical Supabase baseline files: preserved until explicitly remediated

No application schema change may be added to Supabase migrations after this architecture is approved.

## 15. FUTURE CHANGE POLICY
For a future RootGrain application schema change:
1. Update Prisma schema.
2. Generate reviewed Prisma migration.
3. Review SQL.
4. Test against clean/local/staging environment.
5. Apply through approved Prisma migration deployment process.
6. Verify database.
7. Do NOT create an equivalent Supabase application-schema migration.

For Supabase infrastructure changes: Use the appropriate verified Supabase mechanism. Never make the same database object change in both systems.

## 16. MIGRATION HISTORY PRESERVATION
Historical Git history MUST remain recoverable. A migration may become RETIRED or SUPERSEDED without being treated as an active migration. Do NOT rewrite Git history.

## 17. BACKUP / DATA-PROVENANCE SEPARATION
**BACKUP CONTENT: NOT VERIFIABLE**

## 18. TEST-ORDER / BASELINE DATA CLARIFICATION
**HISTORICAL DATA PROVENANCE: NOT VERIFIED**

## 19. PRODUCTION SAFETY
Production/staging application schema: Prisma migration files ONLY.
No `prisma db push`, manual SQL, or Supabase application-schema migration may bypass the approved migration governance.

## 20. FINAL ARCHITECTURE PRINCIPLES
- **INVARIANT 1:** One application database object = one migration authority.
- **INVARIANT 2:** Prisma owns RootGrain application schema migrations.
- **INVARIANT 3:** Supabase owns only verified platform/infrastructure responsibilities.
- **INVARIANT 4:** Supabase cannot independently modify Prisma-owned application objects.
- **INVARIANT 5:** `db:push` cannot replace controlled migration deployment.
- **INVARIANT 6:** Historical migration files are preserved until explicitly remediated.
- **INVARIANT 7:** Retired migration ≠ active migration.
- **INVARIANT 8:** Clean bootstrap must eventually be verified.
- **INVARIANT 9:** Unverified ownership must stop implementation.
- **INVARIANT 10:** Backup/data-provenance uncertainty remains a separate issue.
