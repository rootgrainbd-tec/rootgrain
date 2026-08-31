# MIGRATION HISTORY RECONCILIATION — APPROVAL REQUIRED
## PHASE 6 MTO - SLICE 1

### THE ISSUE

As requested, I inspected the live database state on `127.0.0.1:54322` by querying `_prisma_migrations` and checking the current columns. 

**Findings on Live Database:**
- The last recorded migration is `20260818000000_phase4_slice2`.
- Phase 5 (`20260819000000_phase5_payment_ledger_activation`) **has NOT been applied** to the live database. The `PaymentReferenceClaim` table does not exist, and `PaymentMethod` lacks `CASH`/`OTHER` enums.
- However, Phase 5 **IS** present in the `prisma/migrations` folder and integrated into `prisma/schema.prisma`.

### THE BLOCKER FOR APPLYING PHASE 6

Because Phase 5 is in the migration history but not applied to the live database, Prisma currently sees the live database as "behind" by one migration (Phase 5), plus the new Phase 6 migration we just generated.

If we attempt to apply Phase 6 to the database right now (using `prisma migrate resolve` or similar tools), we are forced to either:
1. Apply Phase 5 to the live database first.
2. Ignore Prisma entirely and manually execute the Phase 6 SQL against the database, resulting in a database state that completely desyncs from the repository's `prisma/migrations` tracker.

### THE GENERATED PHASE 6 SQL (EVIDENCE)

I have successfully generated and saved ONLY the Phase 6 Slice 1 changes into a new migration folder:
`prisma/migrations/20260823000000_phase6_mto_schema/migration.sql`

**Safety Review of Generated SQL:**
- No DROP TABLE or DROP COLUMN commands.
- No destructive changes to Payment Ledger, Invoice, User, or RBAC.
- No unrelated Phase 5 changes (Phase 5 changes were cleanly stripped out).
- It ONLY adds `isMto`, `baseLeadTimeDays`, `additionalUnitLeadTimeDays` to `Product`.
- It ONLY adds `isMtoOrder`, `advanceDeadline`, `estimatedManufacturingDays` to `Order`.
- It ONLY creates the `AdminInternalNote` table and its foreign keys.

*(Prisma Client has also been successfully generated from the schema.)*

### REQUIRED DECISION

To safely apply the Phase 6 SQL to the live database and satisfy Prisma's migration tracker, please authorize one of the following reconciliation strategies:

**OPTION 1 (Recommended): Apply Phase 5, then Phase 6**
Authorize the application of the pending Phase 5 migration to the live database, immediately followed by the execution of the Phase 6 SQL. We will then record Phase 6 in `_prisma_migrations` via `prisma migrate resolve`.

**OPTION 2: Manual SQL Execution (Prisma Desync)**
Authorize the manual execution of the Phase 6 SQL against the live database directly. I will use `prisma migrate resolve --applied 20260823000000_phase6_mto_schema` and `prisma migrate resolve --applied 20260819000000_phase5_payment_ledger_activation` to forcibly tell Prisma they are applied, even though Phase 5 was not actually executed on the live DB. (This risks runtime errors if Phase 5 features are used).

**OPTION 3: Reset Database**
Wipe the local database entirely and let Prisma replay all migrations from the beginning. *(Note: This will likely crash due to the historical corruption in `20260802080225_slice_2_1a` discussed previously.)*

Awaiting your directive on how to reconcile the missing Phase 5 live database state.
