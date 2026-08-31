# ROOTGRAIN — MIGRATION HISTORY REMEDIATION PLAN
PHASE 6 / NATIVE POSTGRESQL

## Status
**AWAITING APPROVAL**

## 1. Exact Failure & Migration
- **Failed Migration**: `20260802080225_slice_2_1a`
- **Failure Error**: `P3018 - error encoding message to server: string contains embedded null`

## 2. Root Cause Evidence (Byte-Level Investigation)
A byte-level inspection of the `migration.sql` file reveals that the entire file was accidentally saved in **UTF-16LE** encoding (likely via a PowerShell output redirection `>` or `Out-File` without specifying ASCII/UTF-8).
- **File Size:** 9148 bytes
- **Null Bytes Found:** 4573 (Every ASCII character is padded with a `\0` byte).
- **Prisma Behavior:** Prisma reads the file, calculates its SHA-256 checksum, and passes the string to PostgreSQL. PostgreSQL interprets the UTF-16 padding as embedded nulls, immediately terminating the connection. This is an **accidental file corruption** issue, not intentional binary data.

## 3. Intended Schema Effect
By reading the file using UTF-16 decoding, the migration is revealed to be the initial attempt at **Phase 5a RBAC Authorization**. It contains statements to create tables such as `AuthRole`, `Permission`, `RolePermission`, `UserPermission`, `Policy`, `AuditLog`, and `FeatureFlag`.

## 4. Git History & Production Investigation
- **Git Commit:** The file was introduced in commit `82e2530` directly as a binary (UTF-16) file. 
- **Schema Purge:** In commit `34cbc7d` ("final nextauth schema migration"), the RBAC models were explicitly deleted from `schema.prisma` because Phase 5a was abandoned in favor of coarse-grained `ADMIN` role checks (as documented in `0020-phase5a-rbac-authorization-decision.md`).
- **Production Status:** A grep of `backup_live_production_phase5_pre_migration.sql` confirms that **this migration is already marked as applied in production** with checksum `8844158899641a77fd1ea657e41475ce9ab3dbf524e4e770e6d9f6d8b62a8929`.
- **How did it apply to Production?** Because it cannot be executed by PostgreSQL, the only way it entered the production `_prisma_migrations` table is if a developer previously bypassed it using `npx prisma migrate resolve --applied 20260802080225_slice_2_1a`. This generated the checksum and marked it applied without executing the SQL, meaning **production does NOT actually have the RBAC tables**, which perfectly matches the current `schema.prisma`.

## 5. Remediation Options Analysis

### Option A — Repair the Historical Migration (REJECTED)
- **Concept:** Re-encode the file to standard UTF-8 so it can execute successfully.
- **Why it's rejected:** Altering the file bytes will change its SHA-256 checksum. Because the migration is already applied in production with the UTF-16 checksum (`8844...`), modifying the file in the repository will trigger a **Checksum Mismatch Error** during the next production deployment, breaking CI/CD completely.

### Option C — Fresh Development Baseline (REJECTED)
- **Concept:** Delete all old migrations and generate a single baseline migration for the current schema.
- **Why it's rejected:** Requires squashing history and modifying the `_prisma_migrations` table in all existing environments (Production, Vercel, Staging) to accept the new baseline. The risk to production stability is extremely high and unnecessary.

### Option B — Safe Reconciliation via `migrate resolve` (RECOMMENDED)
- **Concept:** Accept that the file is corrupt in Git and was already bypassed in existing environments. We will identically bypass it in our fresh Native PostgreSQL environment using `npx prisma migrate resolve --applied`.
- **Phase 5/6 Compatibility:** Preserves all history. The migration chain will successfully continue to Phase 5 and Phase 6 Slice 1 exactly as intended.
- **Production/CI Impact:** **ZERO.** The file checksum is left untouched, preserving absolute compatibility with Vercel and Production.
- **Schema Consistency:** Since the RBAC tables were deleted from `schema.prisma`, bypassing their creation aligns our local database with the true intended schema and production reality.

## 6. Execution Steps (If Approved)
1. Ensure Native PostgreSQL is running and `.env` is configured.
2. Run `npx prisma migrate resolve --applied 20260802080225_slice_2_1a` on the fresh database.
3. Run `npx prisma migrate deploy` to resume and apply Phase 5 and Phase 6 Slice 1.
4. Run `npx prisma generate`.
5. Proceed to MTO Slice 2 functional tests.

## 7. Explicit Approval Boundary
This investigation is complete. Do not execute the bypass without explicit human authorization.
