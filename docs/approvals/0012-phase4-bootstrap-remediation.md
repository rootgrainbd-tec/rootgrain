# 0012-PHASE4-BOOTSTRAP-RECONCILIATION

**Document:** docs/approvals/0012-phase4-bootstrap-remediation.md
**Status:** RECONCILED / APPROVED

## 1. CORRECTED ASSUMPTION
The previous recommendation incorrectly assumed a new isolated/disposable Supabase environment was required to prove the bootstrap. This was based on the false assumption that existing evidence was insufficient. 

Existing repository evidence already definitively proves a successful local bootstrap after the legacy Supabase application-schema migrations were removed/archived:
`Supabase local` → `Prisma migration` → `7/7 migrations successful` → `expected application tables created`.

No new isolated Docker architecture, secondary Supabase project, or destructive database reset is necessary or authorized.

## 2. THE CORE TECHNICAL DISTINCTION
The technical problem was NOT that "Supabase is broken." The specific technical problem was that **Legacy Supabase application-schema migration files overlapped with the Prisma application-schema migration authority.**

**Architecture:**
- **SUPABASE:** PostgreSQL / local environment / verified platform responsibilities
- **PRISMA:** RootGrain application-schema authority
- **LEGACY SUPABASE APPLICATION MIGRATIONS:** OBSOLETE / RETIRED / SUPERSEDED

## 3. EXISTING BOOTSTRAP EVIDENCE
**EXISTING BOOTSTRAP EVIDENCE: VERIFIED FROM PRIOR RUN**
1. Supabase local environment started.
2. PostgreSQL was reachable.
3. Legacy application-schema migrations were no longer active.
4. Prisma migration deployment succeeded.
5. Prisma migrations: 7/7 SUCCESS.
6. Expected application tables existed.
7. Supabase infrastructure remained healthy.

## 4. LEGACY SUPABASE MIGRATIONS & GOVERNANCE
**Technical Result:** Legacy application-schema migrations should not remain an active application-schema authority. The legacy application-schema migration layer caused the previous Prisma P3005/bootstrap conflict.
**Governance Result:** Their previous deletion occurred without explicit approval.

The historical files (`20260522000000_init.sql`, `20260522000001_seed.sql`, `20260522000002_phase4.sql`) have been exactly restored to Git history to preserve artifacts. However, they are classified as **RETIRED / SUPERSEDED APPLICATION-SCHEMA MIGRATIONS** and MUST NOT be restored into an ACTIVE Supabase migration path that would recreate the dual-authority conflict.

## 5. MIGRATION AUTHORITY & OVERLAP
**ONE APPLICATION DATABASE OBJECT = ONE MIGRATION AUTHORITY**
No application table, enum, FK, index, or constraint is actively managed by both systems. Prisma exclusively manages RootGrain application objects. Supabase exclusively manages infrastructure/platform responsibilities.

## 6. db:push POLICY
`prisma db push` is explicitly NOT used as the controlled production/staging application-schema deployment mechanism. Production/staging schemas strictly use Prisma migration files ONLY.

## 7. SLICE 1 FINAL VERIFICATION
- Live DB ↔ Prisma schema MATCH.
- Prisma migration checksum MATCH.
- FK RESTRICT for OrderItem and PaymentRecord VERIFIED.
- Slice 1 targeted tests PASS.

## 8. REMAINING NOT VERIFIED ISSUES
The following remain explicitly unresolved as separate issues and do not block the architecture verification:
- **BACKUP CONTENT:** NOT VERIFIABLE (Original `clean_backup.sql` cannot be recovered).
- **HISTORICAL DATA PROVENANCE:** NOT VERIFIED (Test order counts currently 0 without independent original artifact proof).
- **FULL REGRESSION:** NOT GREEN (12 pre-existing module-level failures remain).
