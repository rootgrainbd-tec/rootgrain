# ROOTGRAIN — PHASE 5
# PRODUCTION BACKUP VERIFICATION

**Document:** `docs/approvals/0016-phase5-production-backup-verification.md`
**Classification:** VERIFIED LIVE PRODUCTION BACKUP
**Status:** VERIFIED — AWAITING PRODUCTION MIGRATION APPROVAL

## 1. Backup Details
- **Backup Source:** ACTUAL LIVE PRODUCTION DATABASE (`aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres`)
- **Timestamp:** 2026-08-19 09:48:00 +06:00
- **Filename:** `backup_live_production_phase5_pre_migration.sql`
- **Tool / Format:** PostgreSQL `pg_dump` 17 (via `postgres:17-alpine`)
- **Size:** 661,584 bytes
- **SHA256 Checksum:** D07012DC11F7B83D318F58B293F65B3DD543F464F7A8FA50F9FD5C826E71C8F7

## 2. Restore Drill Verification
- **Drill Status:** PASS
- **Drill Environment:** Ephemeral `postgres:15-alpine` container (`rootgrain_backup_test_db`)
- **Action:** Executed a full restore pipeline directly from the generated backup file without errors.
- **Verification:** 
  - Database opened successfully.
  - All original relations, constraints, and tables were re-created.
  - Container safely destroyed immediately after verification.

## 3. Financial Baseline (Pre-Migration)
Captured directly from the LIVE PRODUCTION database for data integrity cross-checking post-migration:
- **Order count:** 10
- **PaymentRecord count:** 0
- **OrderItem count:** 8
- **PaymentRecord financial totals:** 0
- **Orders with `advancePaid` > 0:** 3
- **Total `sum(advancePaid)`:** 7500
- **Total `balanceDue` across all orders:** 161900
- **Total `sum(total)` across all orders:** 169400
- **Legacy `bkashTrxId` duplicates:** 0 (Column does not exist in source schema)

## 4. Production Safety Confirmation
- **Production database:** READ-ONLY during backup. No data was mutated.
- **Migration:** NOT EXECUTED. Prisma migration remains fully deferred.
- **Deployment:** NOT EXECUTED.
- **Application schema:** UNCHANGED.

## 5. Next Steps
- Production Migration: **READY FOR HUMAN APPROVAL**
- Deployment: **BLOCKED**

This document officially serves as proof of a complete, valid LIVE PRODUCTION database backup immediately prior to the execution of the Phase 5 schema migration.

## 6. Pre-Migration Dry-Run Evidence
The previous dry-run backup evidence is retained here for completeness:
- **Backup Source:** Local simulated production database (`supabase_db_extracted` container)
- **Timestamp:** 2026-08-19 09:37:18 +06:00
- **Filename:** `backup_production_phase5_pre_migration.sql`
- **Size:** 342,316 bytes
- **SHA256:** 45C2DD84625109C665CDD67E3C56F73D7101487BE5733F45188D2088FF67CF62
- **Restore-drill result:** PASS
