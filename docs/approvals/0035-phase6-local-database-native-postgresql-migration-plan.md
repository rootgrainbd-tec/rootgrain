# ROOTGRAIN LOCAL DATABASE ENVIRONMENT
**Docker → Native PostgreSQL Migration Plan**

## Status
**AWAITING APPROVAL**

---

## 1. Current Environment & Architecture
- **Database Provider**: PostgreSQL
- **Current Architecture**: The local database was previously hosted via a Docker container, likely managed by the Supabase CLI (indicated by `localhost:54322` in the `.env` file and the presence of a `supabase/` directory).
- **Current `DATABASE_URL`**: `postgresql://postgres:postgres@localhost:54322/postgres`
- **Current `DIRECT_URL`**: `postgresql://postgres:postgres@localhost:54322/postgres`
- **Current `SHADOW_DATABASE_URL`**: `postgresql://postgres:postgres@localhost:54322/shadow`
- **Prisma Configuration**: Prisma is configured to use the PostgreSQL provider and expects a shadow database for `prisma migrate dev`.

## 2. Docker Dependencies Discovered
After a thorough audit of the repository, the following dependencies on Docker were analyzed:
- **PostgreSQL Database**: REQUIRED FOR DATABASE. (Previously running via Docker, explicitly being replaced by this plan).
- **Redis**: NOT REQUIRED FOR DATABASE. The `package.json` uses `@upstash/redis`, indicating Redis is hosted in the cloud via Upstash. No local Docker container is needed for Redis.
- **Supabase Local Services**: OPTIONAL/DEPRECATED. The `supabase/` folder exists, but no `config.toml` is present in the root of that folder. Supabase local development relies on Docker. We will bypass this and connect Prisma directly to Native PostgreSQL.
- **Other Services**: (Sanity, Resend, bKash) are all cloud-based.

**Conclusion**: PostgreSQL is the *only* local service that strictly depended on Docker for development.

## 3. Docker Removal Impact & Data Preservation
- **Impact**: Docker Desktop has been uninstalled. All Docker volumes (including the local PostgreSQL data volume) have been permanently destroyed.
- **Database Data Preservation Status**: **NOT RECOVERABLE** from Docker. The original local development data is gone. 
- **Note on Backups**: The repository does contain several SQL dump files (e.g., `db_backup.sql`, `backup_live_production_phase5_pre_migration.sql`). If development data must be restored, it may be partially recoverable from these files, but a fresh database strategy is recommended for local development.

## 4. Native PostgreSQL Target Architecture
The new architecture will bypass Docker entirely:
- **Host System**: Windows
- **Service**: Native PostgreSQL (Windows Service)
- **Host/Port**: `localhost:5432`
- **Encoding**: UTF-8
- **Timezone**: UTC
- **Required Databases**: 
  - Main Database (e.g., `rootgrain_local`)
  - Shadow Database (e.g., `rootgrain_shadow`)

## 5. Environment Variable Plan
The environment files (`.env`, `.env.local`) will be updated to point to the Native PostgreSQL service. No other codebase changes are required.

```env
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/<DB_NAME>"
DIRECT_URL="postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/<DB_NAME>"
SHADOW_DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/<SHADOW_DB_NAME>"
```

## 6. Migration History Safety
**CRITICAL**: All existing historical migrations in `prisma/migrations/` **MUST REMAIN FROZEN**.
This includes:
- `20260802080225_slice_2_1a`
- `20260819000000_phase5_payment_ledger_activation`
- `20260823000000_phase6_mto_schema`

They will NOT be squashed, reordered, deleted, or flattened. The Native PostgreSQL setup must accommodate this history as-is.

## 7. Migration Strategy (Fresh Database)
Since the previous Docker database data is destroyed, we will initialize a **Fresh Development Database**.
- **Strategy**: Run `npx prisma migrate deploy` against the Native PostgreSQL database.
- **Reasoning**: `migrate deploy` sequentially applies the frozen migration history exactly as it exists in the repository, recreating the schema step-by-step.
- **Safety**: `prisma db push` will NOT be used, as it ignores migration history. `prisma migrate resolve` is not needed for a completely fresh database.

## 8. Phase 5 & Phase 6 Slice 1 Compatibility
- **Phase 5 (Payment Ledger)**: Preserved natively via the `20260819000000_phase5_payment_ledger_activation` migration, which will be executed during `migrate deploy`.
- **Phase 6 Slice 1 (MTO Schema)**: Preserved natively via the `20260823000000_phase6_mto_schema` migration, which will be executed last during `migrate deploy`.

## 9. Shadow Database Analysis & Risk
Prisma requires a shadow database when running `prisma migrate dev` to generate new migrations. It works by replaying the *entire* migration history on the empty shadow database.
- **The Risk**: If the frozen historical migration chain (e.g., `20260802080225_slice_2_1a`) contains conflicts, syntax errors, or corruption that prevents it from cleanly replaying from scratch, `prisma migrate dev` **will fail** on the Native PostgreSQL shadow database, just as it would on Docker.
- **Handling**: We will explicitly provision `<SHADOW_DB_NAME>` in Native PostgreSQL. If `prisma migrate dev` fails due to historical corruption during future development, **it will be documented as a blocked state requiring a separate remediation approval**. We will not silently repair the frozen history.

## 10. Slice 2 Verification Plan
Phase 6 Slice 2 implementation is currently blocked by the database outage. 
Once Native PostgreSQL is running and the schema is deployed, the workflow will be:
1. Start Native PostgreSQL.
2. Run `prisma migrate deploy`.
3. Verify Phase 5 & Phase 6 Slice 1 tables exist.
4. Execute `scratch/test-mto-checkout.ts` to verify Slice 2 business rules.
5. Review Slice 2 completion report.
6. Only then proceed to Phase 6 Slice 3.

## 11. Installation Plan
1. **Install PostgreSQL**: Download and install the officially supported PostgreSQL for Windows (Version 16 recommended).
2. **Setup Service**: Ensure PostgreSQL is running as a Windows background service.
3. **Credentials**: Set a strong password for the default `postgres` user during installation (this will be `<DB_PASSWORD>`).
4. **Create Databases**: Use pgAdmin or `psql` to create two new databases: `rootgrain_local` and `rootgrain_shadow`.
5. **Update Config**: Modify `.env` and `.env.local` to use the new connection strings.

## 12. Backup / Restore Strategy
- **Backup Strategy**: We will rely on native `pg_dump` for future backups of the Native PostgreSQL database.
- **Restore Strategy**: If local development requires seeding from existing `.sql` artifacts (like `db_backup.sql`), we will use `psql -U postgres -d rootgrain_local -f db_backup.sql`.

## 13. Validation Plan
After installation, the following must be validated sequentially:
1. Native PostgreSQL Windows service is running.
2. Port `5432` is reachable on `localhost`.
3. `rootgrain_local` and `rootgrain_shadow` databases are reachable.
4. `npx prisma migrate deploy` successfully applies all migrations up to Phase 6 Slice 1.
5. `npx prisma generate` succeeds.
6. Slice 2 Functional Tests (`scratch/test-mto-checkout.ts`) pass.
7. Normal checkout UI regression test passes.
8. `npm run build` succeeds.

## 14. Explicit Approval Boundaries
- **Files Changing**: ONLY `.env` and `.env.local`.
- **Files Frozen**: `prisma/migrations/*`, `prisma/schema.prisma`, application code.
- **Rollback**: If Native PostgreSQL poses insurmountable issues with the Prisma history, the rollback plan is to reinstall Docker Desktop and revert `.env` changes.

## 15. Final Recommendation
**OPTION A**: Native PostgreSQL is safe and straightforward. 
*Reasoning*: The application relies purely on Prisma/PostgreSQL for its database layer. There are no hard dependencies on Docker-specific extensions or network bridges that would prevent a native Windows PostgreSQL instance from acting as a 1:1 replacement for the local Docker container. The only identified risk is the existing migration history corruption, which is agnostic to whether PostgreSQL is containerized or native.

---
**END OF PLAN**
