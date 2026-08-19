# ROOTGRAIN — PHASE 5
# PAYMENT LEDGER ACTIVATION — IMPLEMENTATION GATE

**Document:** `docs/approvals/0016-phase5-payment-ledger-implementation-gate.md`
**Status:** APPROVED

## 1. Status
APPROVED

## 2. Authoritative Approvals
- **0014:** Phase 4 → Phase 5 Transition (APPROVED)
- **0015:** Payment Ledger Activation Specification (APPROVED)
- **0015:** Payment Ledger Activation Decisions (APPROVED)
- **0015:** Payment Ledger Activation Approval (APPROVED)

## 3. Current Repository State
- **Order model:** Defined in `prisma/schema.prisma` lines 34-66. Missing `legacyAdvancePaid`.
- **PaymentRecord model:** Defined in `prisma/schema.prisma` lines 83-97. Has `@unique` on `bkashTrxId`. Missing `reference` and `recordedById`.
- **PaymentReferenceClaim model:** Missing. Required for concurrency-safe digital reference uniqueness without Prisma drift. (METHOD-SCOPED)
- **PaymentMethod enum:** Missing `CASH`, `OTHER`.
- **PaymentStatus enum:** Has `INITIATED`, `COMPLETED`, `FAILED`, `REFUNDED`.
- **IdempotencyKey:** Defined lines 525-538. Has required components.
- **OrderEvent:** Defined lines 540-553.
- **OrderDocument:** Defined lines 555-567.
- **NotificationOutbox:** Defined lines 569-589.
- **Transaction utilities:** `src/lib/prisma.ts` provides the base Prisma client.
- **Authorization utilities:** `src/lib/auth.ts` / `src/services/auth.service.ts` for Admin validation.

## 4. Exact Files to Change
1. `prisma/schema.prisma`
   - **Role:** Database schema
   - **Change:** Add fields, update enums, remove `@unique`.
   - **Reason:** Satisfy 0015 specification constraints.
   - **Dependencies:** None.
   - **Risk:** High (Database altering)
   - **Test Coverage:** Migration dry-run and transaction integration tests.
   - **Classify:** MODIFY

2. `src/services/payment.service.ts` (or `src/app/actions/payment.ts`)
   - **Role:** Financial Business Logic
   - **Change:** Implement `recordPayment` function.
   - **Reason:** Provide the core ledger insertion capability.
   - **Dependencies:** `prisma.ts`, `auth.ts`, validation schemas.
   - **Risk:** High (Financial logic)
   - **Test Coverage:** Full adversarial test suite.
   - **Classify:** CREATE

3. `tests/integration/payment-ledger.test.ts` (or similar)
   - **Role:** Test Suite
   - **Change:** Implement all required 0015 adversarial tests.
   - **Reason:** Prove the `recordPayment` function fulfills the contract.
   - **Dependencies:** Test database, mock data.
   - **Risk:** Low (Test code)
   - **Classify:** CREATE

## 5. Schema Changes
1. `Order.legacyAdvancePaid`
   - **Current:** Does not exist
   - **Target:** `legacyAdvancePaid Int @default(0)`
   - **Rationale:** Immutable snapshot of legacy balance to prevent double-counting.
   - **Data Safety:** Safe.
   - **Migration Impact:** Will be populated from `advancePaid` in SQL.

2. `PaymentRecord.reference`
   - **Current:** Does not exist
   - **Target:** `reference String?`
   - **Rationale:** Allows flexible references.
   - **Migration Impact:** Safe (nullable).

3. `PaymentRecord.recordedById`
   - **Current:** Does not exist
   - **Target:** `recordedById String?`
   - **Rationale:** Audit trail of the Admin who performed the action.
   - **Migration Impact:** Safe (nullable).

4. `PaymentMethod.CASH` & `OTHER`
   - **Target:** Add to enum.

5. `PaymentReferenceClaim` (NEW MODEL)
   - **Target:** 
     ```prisma
     model PaymentReferenceClaim {
       reference String
       method PaymentMethod
       orderId String
       createdAt DateTime @default(now())
       order Order @relation(fields: [orderId], references: [id], onDelete: Restrict)
       @@id([method, reference])
     }
     ```
   - **Rationale:** A raw SQL partial unique index will be dropped by future `prisma migrate dev` runs (Prisma drift). A canonical claim table allows us to insert only digital references (`MANUAL_BKASH`, `BANK_TRANSFER`) during the transaction. It guarantees database-level concurrency protection via the composite `@@id([method, reference])` primary key while remaining 100% Prisma compatible. `CASH` and `COD` do NOT create claims.

6. Remove `bkashTrxId` and enforce reference uniqueness
   - **Current:** `bkashTrxId` exists with `@unique` constraint.
   - **MIGRATION:** Add `reference`, run `UPDATE "PaymentRecord" SET "reference" = "bkashTrxId" WHERE "bkashTrxId" IS NOT NULL;`, populate `PaymentReferenceClaim`, drop `bkashTrxId`.
   - **TARGET:** `bkashTrxId` completely removed. `reference` is canonical.
   - **DATA PRESERVATION:** `bkashTrxId` values safely copied to `reference` and `PaymentReferenceClaim` before drop. Safe because `bkashTrxId` was already `@unique`.
   - **ROLLBACK:** Schema rollback requires restoring SQL backup.

## 6. Migration Plan
1. **Pre-Migration Checks:** Capture read-only baseline values for every Order (`id`, `total`, `advancePaid`, `balanceDue`).
2. **Action 1:** `ALTER TABLE "Order" ADD COLUMN "legacyAdvancePaid" INTEGER DEFAULT 0;`
3. **Action 2:** `UPDATE "Order" SET "legacyAdvancePaid" = "advancePaid";`
4. **Action 3:** Schema migrations for enum expansion, adding `reference`, `recordedById`, and `PaymentReferenceClaim` model.
5. **Action 4:** Data copy: `UPDATE "PaymentRecord" SET "reference" = "bkashTrxId" WHERE "bkashTrxId" IS NOT NULL;`
6. **Action 5:** Concurrency protection data copy: `INSERT INTO "PaymentReferenceClaim" ("reference", "method", "orderId", "createdAt") SELECT "bkashTrxId", "method", "orderId", NOW() FROM "PaymentRecord" WHERE "bkashTrxId" IS NOT NULL;` (Note: Migration safely fails if a duplicate method+reference exists. Because current production PaymentRecord count is verified as 0, there are no historical PaymentReferenceClaim rows to conflict).
7. **Action 6:** `ALTER TABLE "PaymentRecord" DROP COLUMN "bkashTrxId";`
8. **Post-Migration Verification:** Execute SQL queries verifying:
   - `legacyAdvancePaid == pre_migration.advancePaid`
   - `advancePaid == pre_migration.advancePaid`
   - `balanceDue == total - advancePaid`
   - PaymentRecord count remains unchanged.
   - Order row count remains unchanged.
   - No financial value changes unexpectedly.

## 7. Legacy Data Plan
Because `PaymentRecord` count is verified as 0, the rule `legacyAdvancePaid = advancePaid` safely carries forward all financial truth.
- Total Paid = `legacyAdvancePaid + SUM(COMPLETED PaymentRecord)`
- Balance Due = `Order.total - Total Paid`
There are no mixed-history orders.

## 7.5. Financial Invariants
After every successful recordPayment transaction, and before any execution, the following invariants MUST hold true:
- `Order.advancePaid == Order.legacyAdvancePaid + SUM(PaymentRecord WHERE status = 'COMPLETED')`
- `Order.balanceDue == Order.total - Order.advancePaid`
- `Order.balanceDue >= 0`

The implementation must verify these invariants both before payment, after payment, and after migration.

## 8. recordPayment Implementation Plan
1. Validate request shape (amount > 0, valid IDs).
2. Require Admin (via `requireAdmin()` or `auth()`).
3. Derive actor server-side (do not trust client ID).
4. Construct normalized fingerprint (`orderId` + `amount` + `type` + `method` + `reference`).
5. Begin `$transaction`.
6. Claim IdempotencyKey (Scope: `record_payment`, Owner: USER, UUID).
7. Lock Order: `SELECT * FROM "Order" WHERE id=$1 FOR UPDATE`.
8. Read canonical financial state from database (`total`, `advancePaid`, `legacyAdvancePaid`, `balanceDue`, `status`). Do NOT trust client-provided balances.
9. Validate Order status: Reject if CANCELLED or REJECTED.
10. Reconcile and assert invariant: verify `advancePaid == legacyAdvancePaid + SUM(COMPLETED PaymentRecords)`.
11. Calculate available balance. Reject if amount > `available balance`.
12. Enforce Reference Uniqueness: If method is `MANUAL_BKASH` or `BANK_TRANSFER`, create `PaymentReferenceClaim` with `(method, reference)`. If a concurrent transaction already claimed it for the SAME method, this step will fail atomically.
13. Create `PaymentRecord` with `status: 'COMPLETED'` and `recordedById`.
14. Calculate new `advancePaid` and `balanceDue` and update `Order`.
15. Create `PAYMENT_RECORDED` event (`MAX(sequence) + 1`).
16. Create `PAYMENT_RECEIPT` document snapshot.
17. Create `EMAIL_PAYMENT_RECEIPT` outbox intent.
18. Complete `IdempotencyKey`.
19. Commit.

## 9. Transaction Plan
All required transactional mutations must execute atomically using Prisma `$transaction`. If any step throws (e.g., duplicate reference constraint violation, or unique sequence collision), the entire `$transaction` unwinds.

## 10. Idempotency Plan
- **Fingerprint:** SHA-256 of concatenated `orderId:amount:type:method:normalized_reference`.
- **Claim:** Uses `IdempotencyKey` model with a unique constraint on `(ownerType, ownerId, scope, key)`.
- **Conflict:** Throws `IDEMPOTENCY_CONFLICT` if keys match but fingerprints differ.
- **Replay:** Returns the original successful response if already `COMPLETED`.

## 11. Concurrency Plan
- **Same UUID + payload:** Blocked/replayed by Idempotency unique index.
- **Same UUID + diff payload:** Conflict rejected by fingerprint check.
- **Different UUID + same Order:** Strictly serialized by `SELECT FOR UPDATE`. Lost updates on `advancePaid` are mathematically impossible because T2 wakes up and evaluates against the new balance committed by T1.
- **Different UUID + diff Orders:** Executed concurrently without blocking.
- **Concurrent Method-Scoped Reference Claims:** Two concurrent transactions attempting `MANUAL_BKASH` + reference `X` will result in ONE succeeding and ONE failing atomically. A concurrent `MANUAL_BKASH` + `X` and `BANK_TRANSFER` + `X` will NOT conflict.

## 12. Event Plan
Inside the transaction, we must query `SELECT MAX(sequence) FROM OrderEvent WHERE orderId = $1`. This guarantee strictly applies only if all workflows producing OrderEvent obey the `SELECT * FROM "Order" WHERE id = $1 FOR UPDATE` locking discipline. If the repository currently contains another OrderEvent producer that does not lock the Order, it must be identified.

## 13. Document Plan
JSON snapshot containing: `orderNumber`, `amountPaid`, `newBalance`, `paymentMethod`, `paymentType`, `timestamp`, `recordedByAdmin`. No PDF generation occurs in the transaction.

## 14. Outbox Plan
Inserts `NotificationOutbox` with `status: PENDING`, `channel: EMAIL`. The delivery worker will poll this table separately.

## 15. Security Plan
All execution depends on a secure, server-side read of the Admin session. Client-provided Admin IDs are explicitly discarded.

## 16. Test Plan
Create `tests/integration/payment-ledger.test.ts` representing the required adversarial test suite.

## 17. Adversarial Test Plan
1. First payment on legacy Order
2. Multiple payments
3. Exact full payment
4. Overpayment (expect failure)
5. Zero payment (expect failure)
6. Negative payment (expect failure)
7. CANCELLED Order (expect failure)
8. REJECTED Order (expect failure)
9. Unauthorized Admin (expect failure)
10. Guest (expect failure)
11. Forged actor (expect failure)
12. Same idempotency key / same fingerprint (replay success)
13. Same key / different amount (conflict)
14. Same key / different method (conflict)
15. Same key / different reference (conflict)
16. Concurrent same Order payments (serialization check)
17. Concurrent payments exceeding balance (second fails)
18. PaymentRecord failure rollback
19. Order update failure rollback
20. Event failure rollback
21. Document failure rollback
22. Outbox failure rollback
23. Idempotency completion failure
24. Migration verification
25. Legacy financial preservation

## 18. Migration Dry-Run
Procedure:
1. Create disposable PostgreSQL instance.
2. Restore a verified pre-migration backup.
3. Verify baseline row counts.
4. Verify baseline financial values.
5. Apply migration (`npx prisma migrate deploy`).
6. Verify schema.
7. Verify all financial invariants.
8. Verify reference data preservation.
9. Run application integration tests.
10. Verify migration can be recovered safely.
11. Destroy disposable database.
Do NOT run production migration.

## 19. Backup/Restore Gate
The existing pre-Slice-2 backup is NOT automatically sufficient. A NEW pre-Phase-5-migration production backup must be created immediately before the real migration. The backup must have:
- timestamp
- checksum
- size
- source identification
- restore verification

## 20. Rollback Plan
- **SCHEMA ROLLBACK & DATA RECOVERY:** Prisma migrations dropping columns (e.g., `bkashTrxId`) are destructive. Database rollback strictly requires restoring the pre-migration SQL backup. Do NOT claim the Prisma migration is reversible unless proven.
- **APPLICATION ROLLBACK:** Rollback deployment in Vercel. Code reverting does not alter the database state.

## 21. Observability
Implementation must use logger for failures. Sensitive payment references must not be output to plaintext server logs.

## 22. Implementation Order
1. Schema implementation
2. Migration creation
3. Migration local validation
4. Service/action implementation
5. Transaction integration
6. Event/document/outbox integration
7. Test implementation
8. Full test suite
9. Migration dry-run
10. Implementation audit
11. Human implementation approval
12. Production migration gate
13. Deployment gate

## 23. Scope Boundary
Out of scope: refunds, external email network calls, PDF generation, Stripe/SSLCommerz.

## 24. Implementation Acceptance Criteria
- All transactional state changes commit atomically.
- Duplicate idempotency request cannot create a second payment.
- Fingerprint mismatch is rejected.
- Concurrent same-order payments serialize safely.
- Concurrent payment cannot create a negative balance.
- Reference uniqueness policy survives concurrency (enforced by DB index).
- Financial invariant holds before and after payment.
- Migration preserves every pre-existing financial value.
- Rollback/recovery procedure is verified.
- No unrelated repository changes exist.

## 25. Definition of Done
Approved schema implemented, migration validated, tests passing, financial invariants perfectly protected.

## 26. FINAL REFERENCE UNIQUENESS DECISION
METHOD-SCOPED UNIQUENESS.

Digital payment reference uniqueness applies to `(method, reference)`.
This avoids false-positive collisions between independent payment institutions, preserves uniqueness within the same payment method, aligns naturally with a composite claim key, and remains concurrency-safe.

**Status:** APPROVED

## 27. Human Approval Gate
**Status:** APPROVED — HUMAN APPROVAL RECEIVED

## 28. Explicit Implementation Block
**PAYMENT LEDGER IMPLEMENTATION OPENED.**
