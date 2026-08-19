# ROOTGRAIN — PHASE 5
# PAYMENT LEDGER ACTIVATION — DECISION RECORD

**Document:** `docs/approvals/0015-phase5-payment-ledger-activation-decisions.md`
**Status:** APPROVED

## 1. Status
APPROVED

## 2. Authoritative References
- `docs/approvals/0005R1-financial-model-payment-architecture-freeze.md`
- `docs/approvals/0009-phase4-database-transaction-foundation.md`
- `prisma/schema.prisma`

## 3. Decision 1 — Cancelled/Rejected Orders

**SOURCE EVIDENCE:**
- `0005R1` Section 13: "If an order is marked CANCELLED or REJECTED, the PaymentRecord history remains completely untouched. Financial facts are immutable..."

**ANALYSIS:**
The authoritative source explicitly protects historical payments. However, it does not explicitly define whether *new* payments can be created on a cancelled order. Logically, a cancelled order is a terminated agreement. Accepting new money for a cancelled order creates a financial inconsistency.

**PROPOSED DECISION:**
REJECT NEW PAYMENTS FOR CANCELLED / REJECTED ORDERS. 
Historical payments remain immutable and preserved.

**RATIONALE:**
A cancelled/rejected Order cannot receive a new financial mutation through `recordPayment`, preserving logistical and financial sanity.

**IMPLEMENTATION CONSEQUENCE:**
The `recordPayment` validation block will check `Order.status` and throw a business error if the order is `CANCELLED` or `REJECTED`.

**STATUS:**
APPROVED — reject new payments on CANCELLED/REJECTED Orders
Approver: HUMAN APPROVAL RECEIVED

## 4. Decision 2 — Legacy advancePaid Transition

**SOURCE EVIDENCE:**
- `0005R1` Section 17 & 19: Retains `advancePaid` as a cache and prohibits synthetic records.
- `0005R2` Section 5 & 6: Production audit proves there are exactly **0 PaymentRecord rows** in the entire database. Case C, D, E, and F (mixed history) mathematically do not exist in production.

**ANALYSIS:**
If `advancePaid` is the cached total (e.g. 5000), and a new payment arrives, updating `advancePaid` to just `SUM(PaymentRecord.amount)` loses the legacy 5000. 
Because `0005R2` proves no Order has both `advancePaid` AND `PaymentRecord` history, a single rule safely captures all legacy balances without risk of double-counting.

**PROPOSED DECISION:**
Introduce a dedicated ledger initialization marker: `Order.legacyAdvancePaid` (Int).
- **Migration:** A one-time SQL migration sets `legacyAdvancePaid = advancePaid`. (Safe universally because `0005R2` proves `PaymentRecord` count is 0 for all orders).
- **Formula:** The deterministic transaction formula becomes: `Total Paid = legacyAdvancePaid + SUM(PaymentRecord.amount)`.

**RATIONALE:**
This is the only mathematically rigorous way to support `SUM(PaymentRecord)` while safely carrying forward untracked legacy balances without double-counting or losing history. 

**IMPLEMENTATION CONSEQUENCE:**
Phase 5 Prisma schema migration will add `legacyAdvancePaid Int @default(0)` to the `Order` model.

**STATUS:**
APPROVED — legacyAdvancePaid transition model
Approver: HUMAN APPROVAL RECEIVED

## 5. Decision 3 — PaymentRecord Success Semantics

**SOURCE EVIDENCE:**
- `prisma/schema.prisma` shows `PaymentRecord` has `status PaymentStatus @default(INITIATED)`.
- `0005R1` Section 28: "The PaymentStatus enum is preserved. Manually recorded Admin payments will default to COMPLETED."

**ANALYSIS:**
`PaymentRecord` contains a `status` field. Therefore, "successful PaymentRecord" is not simply *all* committed rows, but specifically rows where `status = COMPLETED`.

**PROPOSED DECISION:**
A successful ledger entry that counts towards `Total Paid` is defined strictly as a `PaymentRecord` where `status = COMPLETED`.

**RATIONALE:**
Aligns exactly with existing database schema and `0005R1` directives.

**IMPLEMENTATION CONSEQUENCE:**
The `recordPayment` aggregate query must filter: `where: { orderId, status: 'COMPLETED' }`.

**STATUS:**
SOURCE-DEFINED

## 6. Decision 4 — bkashTrxId / reference

**SOURCE EVIDENCE:**
- `0005R1` Section 5: "The strict `@unique` constraint on the existing `bkashTrxId` prevents generic references... Replace `bkashTrxId` with `reference String?`. Uniqueness validation for digital transaction IDs (like bKash) will be enforced at the application layer..."
- `0005R1` Section 29: "Remove `@unique` from `bkashTrxId` (deprecating it in favor of `reference`)."

**ANALYSIS:**
The architectural freeze explicitly mandates removing the database-level uniqueness constraint to allow non-unique cash references, delegating uniqueness checks to the application logic for specific digital methods.

**PROPOSED DECISION:**
Database-level uniqueness on `bkashTrxId` will be dropped. The new `reference` column will NOT have a `@unique` constraint. The application layer (`recordPayment` logic) will manually query for duplicate references and reject them.
- `MANUAL_BKASH` uniqueness is SOURCE-DEFINED by `0005R1`.
- `BANK_TRANSFER` uniqueness is a PROPOSED APPLICATION POLICY (to safely extend the "digital transaction ID" logic).
- `CASH` and `COD` will tolerate duplicate/empty references.

**RATIONALE:**
Preserves source directives perfectly while explicitly defining which specific methods enforce application-layer uniqueness.

**IMPLEMENTATION CONSEQUENCE:**
Phase 5 Migration alters the schema. Application code adds a `findFirst` check for duplicate references based on the `method`.

**STATUS:**
PARTIAL SOURCE-DEFINED / PARTIAL PROPOSED — APPROVED

## 7. Decision 5 — Idempotency Fingerprint

**SOURCE EVIDENCE:**
- `0009` Section 13: "For a request: (scope, key, requestFingerprint)... Existing record found AND fingerprint differs -> IDEMPOTENCY_CONFLICT."

**ANALYSIS:**
The fingerprint defines the semantic identity of the operation. If a client retries the same idempotency key but changes the amount, method, or reference, it is a materially different request and should be flagged as a conflict to prevent accidental data corruption or mistaken assumptions.

**PROPOSED DECISION:**
The Idempotency Fingerprint for `recordPayment` MUST include:
`orderId` + `amount` + `type` + `method` + `reference` (normalized).
If `reference` is null, it normalizes to an empty string.

**RATIONALE:**
Detects materially different requests, allows legitimate network retries (where payload is identical), and rejects replay misuse where payload fields have been altered. 

**IMPLEMENTATION CONSEQUENCE:**
The fingerprint hash generation logic will explicitly concatenate these 5 fields.

**STATUS:**
APPROVED — five-field normalized idempotency fingerprint
Approver: HUMAN APPROVAL RECEIVED

## 8. Cross-Decision Consistency
- **Legacy Order + multiple Payments:** `legacyAdvancePaid` + `SUM(COMPLETED)` works deterministically.
- **Modern Order + multiple Payments:** `legacyAdvancePaid` (is 0) + `SUM(COMPLETED)` works perfectly.
- **Cancelled Order + new Payment:** Rejected by Decision 1.
- **Cancelled Order + historical Payment:** Handled gracefully since history is untouched.
- **Same idempotency key with changed reference:** Throws conflict (Decision 5).
- **Payment reference duplication:** Handled by application layer logic for digital transactions (Decision 4).

## 9. Financial Invariants
- **Total Paid >= 0**: Enforced by validation rejecting negative amounts and `COMPLETED` filter.
- **Balance Due = Order.total - Total Paid**: Enforced transactionally.
- **Balance Due >= 0**: Enforced by transaction validation rejecting payments larger than balance.
- **Double-Counting Legacy**: Eliminated via `legacyAdvancePaid` base.
- **Idempotent Mutations**: Protected by `orderId:amount:type:method:reference` fingerprint.

## 10. Remaining Open Decisions
All human decisions have been formally approved.

## 11. Implementation Consequences
- Phase 5 Prisma migration is confirmed to require:
  - `Order.legacyAdvancePaid Int @default(0)`
  - `PaymentRecord.reference String?`
  - `PaymentRecord.recordedById String?`
  - `PaymentMethod` enum expansion (`CASH`, `OTHER`)
  - Drop `@unique` on `bkashTrxId`

## 12. Human Approval Requirement
APPROVED
