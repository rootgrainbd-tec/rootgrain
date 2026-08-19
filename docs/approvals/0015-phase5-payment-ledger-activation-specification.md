# ROOTGRAIN — PHASE 5
# PAYMENT LEDGER ACTIVATION — SPECIFICATION

## 1. Status
APPROVED FOR IMPLEMENTATION GATE

## 2. Authoritative References
- `docs/approvals/0005R1-financial-model-payment-architecture-freeze.md`
- `docs/approvals/0008-phase3-repository-data-architecture-mapping.md`
- `docs/approvals/0009-phase4-database-transaction-foundation.md`
- `docs/approvals/0013-phase4-slice2-implementation-final.md`
- `docs/approvals/0014-phase4-slice3-specification.md` (Amended to Phase 4 → 5 Transition)
- `prisma/schema.prisma` (Current Production Schema)

## 3. Phase 5 Context
The Phase 4 Foundation is formally complete, establishing required database models (`OrderEvent`, `OrderDocument`, `NotificationOutbox`, `IdempotencyKey`) and strict transaction boundaries. The system must now activate the business logic (Phase 5) utilizing these foundational primitives to handle the `recordPayment` workflow.

## 4. Problem Statement
Currently, financial updates (like `advancePaid`) are either manual or untracked legacy fields without a robust Ledger. The system needs to instantiate the `recordPayment` action, establishing `PaymentRecord` as the canonical source of truth for all post-upgrade payments, safely orchestrating the database transactions across Order updates, historical receipt documents, outbox intents, and idempotency guarantees.

## 5. Goals
- Implement the `recordPayment` business workflow safely and securely.
- Enforce `PaymentRecord` as the financial source of truth.
- Integrate the Phase 4 database foundations (Idempotency, Locks, Events, Documents, Outbox) into the financial transaction lifecycle.
- Update the Prisma schema to fully support the Phase 2/3 `PaymentRecord` requirements.

## 6. Non-Goals
- Modifying legacy financial values retroactively.
- Automatic Refund Engine or multi-currency support.
- Stripe / SSLCommerz Integrations.
- Actual execution of external network calls (Email dispatch) inside the transaction boundary.
- Generating physical PDF files inside the database transaction.

## 7. Scope
IN SCOPE:
- `recordPayment` Server Action/Service.
- Prisma schema migration for `PaymentRecord` to add `reference` and `recordedById`, and expanding `PaymentMethod`.
- Transactional atomicity mapping (Payment, Order update, Event, Document snapshot, Outbox intent).
- Idempotency and Concurrency enforcement.

OUT OF SCOPE:
- Price Revision, MTO workflow, CustomRequest.
- Payment voiding/cancellation.

## 8. Business Rules
- `PaymentRecord` where `status = COMPLETED` is the absolute source of truth for all new payments. (SOURCE-DEFINED)
- `Order.legacyAdvancePaid` holds the untracked historical opening balance.
- `Order.advancePaid` acts as the cached `Total Paid` aggregate.
- `Order.balanceDue` is `Order.total - Order.advancePaid`.
- Payment Amount MUST be > 0 and <= `balanceDue`.
- Overpayments are prohibited.
- Refund operations are explicitly out of scope (amount must be positive).
- `PaymentRecord` history is immutable and survives Order cancellation.
- New payments on `CANCELLED` or `REJECTED` orders are explicitly rejected.

## 9. Payment Ledger Model
The current `prisma/schema.prisma` defines `PaymentRecord` but is missing key attributes designated by `0005R1`.
- **Identity:** `id` (cuid)
- **Order Relationship:** `orderId`
- **Amount:** `amount` (Int minor units)
- **Payment Type:** `type` (ADVANCE, INSTALLMENT, COD)
- **Immutable/Mutable:** Completely immutable once committed. No normal hard-deletes permitted.
- **Ownership:** Admin (recorded by).

**SCHEMA INSUFFICIENCY DETECTED:**
Current schema retains `@unique` on `bkashTrxId` and lacks `reference` and `recordedById`. It also lacks `CASH` and `OTHER` in `PaymentMethod`. These gaps must be resolved in Phase 5 migration. (Note: `idempotencyKey` inside PaymentRecord is no longer needed due to the Phase 4 generic `IdempotencyKey` model).

## 10. Financial Source of Truth
`PaymentRecord` ledger -> `Total Paid` -> `Balance Due` -> `Order` financial snapshot.
- **Total Paid:** Calculated via Prisma aggregation `SUM(amount)` over all `PaymentRecords` where `status = COMPLETED` for the Order, added to `Order.legacyAdvancePaid`.
- **Balance Due:** `Order.total` - `Total Paid`.
- **Order Updates:** The resulting `Total Paid` is cached into `Order.advancePaid`. The resulting `Balance Due` is cached into `Order.balanceDue`.
- **Legacy Compatibility:** To prevent double-counting legacy amounts, `Total Paid` uses `legacyAdvancePaid` (set via migration) as the opening balance base.
- **Zero/Negative amounts:** Explicitly rejected.
- **Partial/Full payments:** Supported. Overpayments rejected.

## 11. recordPayment Contract
**INPUT:**
- `orderId` (String)
- `amount` (Int)
- `type` (PaymentType)
- `method` (PaymentMethod)
- `reference` (String, nullable)
- `idempotencyKey` (String UUID)

**OUTPUT:**
- `paymentId` (String)
- `newTotalPaid` (Int)
- `newBalanceDue` (Int)
- `eventId` (String)

**VALIDATION:**
- Valid `orderId`.
- Amount > 0.
- Amount <= `balanceDue`.
- Valid Idempotency fingerprint (hash of `orderId` + `amount` + `type` + `method` + `reference`).

## 12. Authorization
- **Requirement:** Admin-only.
- **Actor Identity:** Server-derived from verified Admin session (`requireAdmin()`).
- **Client Forgery:** The client MUST NOT be allowed to forge the actor identity.
- **Guest Behavior:** Guests cannot record payments; explicitly rejected.

## 13. Transaction Design
**BEGIN TRANSACTION**
1. **Idempotency Claim:** Create `IdempotencyKey` (Scope: `record_payment`, Owner: Admin, Key: client UUID, Fingerprint).
2. **Lock:** `SELECT * FROM "Order" WHERE id = $1 FOR UPDATE`
3. **Read Financial State:** Verify Order exists, fetch `total`, `advancePaid`, `legacyAdvancePaid`.
4. **Validate:** Assert Amount > 0 and Amount <= `total - advancePaid` (or `balanceDue`).
5. **Mutation 1:** `INSERT INTO "PaymentRecord"` (Must explicitly include `status = COMPLETED`).
6. **Mutation 2:** `UPDATE "Order" SET advancePaid = newTotal, balanceDue = newBalance`.
7. **Mutation 3:** `INSERT INTO "OrderEvent"` (`PAYMENT_RECORDED`).
8. **Mutation 4:** `INSERT INTO "OrderDocument"` (`PAYMENT_RECEIPT`).
9. **Mutation 5:** `INSERT INTO "NotificationOutbox"` (Intent to email receipt).
10. **Idempotency Completion:** Update `IdempotencyKey` status to `COMPLETED` with `paymentId`.
**COMMIT**

## 14. Idempotency
- **Owner:** `IdempotencyOwnerType.USER` (Admin's User ID).
- **Scope:** `record_payment`
- **Key:** Client UUID.
- **Fingerprint:** SHA-256 or consistent string of `orderId` + `amount` + `type` + `method` + `reference` (normalized to empty string if null).
- **Claim Behavior:** Unique constraint prevents concurrent execution.
- **Replay Behavior:** If identical request arrives, original `paymentId` returned without re-executing business logic.
- **Conflict Behavior:** Same key, different fingerprint -> throws `IDEMPOTENCY_CONFLICT`.
- **P2002 Behavior:** Translated to a safe abort.
- **Transaction Interaction:** Fully atomic with the financial ledger.

## 15. Concurrency
- **Concurrent identical payments (same UUID):** Database unique constraint on `IdempotencyKey` enforces strict serialization. One wins, one replays.
- **Concurrent distinct payments (same Order):** `FOR UPDATE` lock forces serialization. T1 completes, T2 wakes up, reads new `advancePaid`, and calculates against the new balance. If T2 amount > new balance, it fails validation cleanly.
- **Concurrent distinct payments (different Orders):** Proceed cleanly in parallel.
- **Lost updates:** Eliminated by the `FOR UPDATE` lock.

## 16. Order Event
- **Event Name:** `PAYMENT_RECORDED`
- **Aggregate:** `Order`
- **Sequence:** Dynamically allocated via `MAX(sequence) + 1` inside the transaction lock.
- **Actor:** `{"type": "ADMIN", "id": "<userId>", "name": "<userName>"}`
- **Payload:** `{"paymentId": "<id>", "amount": <amount>, "method": "<method>", "type": "<type>", "reference": "<ref>", "newBalance": <balance>}`
- **Immutability:** Strictly immutable. Hard-delete prohibited.

## 17. Payment Receipt Document
- **Required:** Yes, to snapshot financial state.
- **Document Type:** `PAYMENT_RECEIPT`
- **Reference Identity:** `PaymentRecord.id`
- **Snapshot Contents:** Order total, amount paid, new balance, date, customer details at time of transaction.
- **Template Version:** e.g., `v1`
- **Immutability:** Strictly immutable historical evidence.
- **External Separation:** PDF generation is external and async. Database only stores the JSON snapshot.

## 18. Notification Outbox
- **EventReference:** `OrderEvent.id` (of `PAYMENT_RECORDED`)
- **NotificationType:** `EMAIL_PAYMENT_RECEIPT`
- **Channel:** `EMAIL`
- **Status:** `PENDING`
- **Transaction:** Intent is safely committed atomically. Actual worker delivery is OUTSIDE the transaction.

## 19. Failure Semantics
| Failure | Expected Result | Rollback? | Retry? | Replay? |
|---|---|---|---|---|
| Unauthorized Admin | 403 Forbidden | N/A | No | No |
| Negative/Zero Amount | Validation Error | Yes | No | No |
| Amount > Balance | Validation Error | Yes | No | No |
| Duplicate Idemp. Key (Same Fingerprint) | Success Response | Yes (Current Tx) | No | Yes |
| Duplicate Idemp. Key (Diff Fingerprint) | Idemp. Conflict | Yes | No | No |
| Connection Timeout | 500 Error | Yes | Yes | No |
| Client Disconnect | 500 Error / Abort | Yes | Yes | No |

## 20. Financial Edge Cases
- **First payment:** Sum is exact payment + `legacyAdvancePaid`.
- **Multiple installments:** Allowed if `balanceDue` > 0.
- **Exact full payment:** `balanceDue` becomes 0.
- **Overpayment:** Explicitly rejected by validation.
- **Negative/Zero payment:** Explicitly rejected by validation.
- **Cancelled orders:** New payments are explicitly rejected to preserve financial sanity.
- **Duplicate Reference:** Application logic rejects duplicate references if method is `MANUAL_BKASH` (SOURCE-DEFINED) or `BANK_TRANSFER` (APPROVED).
- **Currency:** BDT implicitly maintained via Integer minor units (Paisa) or raw Taka.

## 21. State Transitions
- **Financial State:** `balanceDue` and `advancePaid` accurately reflect `PaymentRecord` sum.
- **Order Status:** According to `0005R1`, Order Status (`PENDING_ADVANCE`, `CONFIRMED`) is strictly decoupled from Payment State. `recordPayment` MUST NOT magically update Order Status.

## 22. Security
- **Forged Actor ID:** Blocked by server-only session reads.
- **Cross-Order Replay:** Blocked by fingerprint including `orderId`.
- **Payment Reference Leakage:** Handled via Admin-only dashboards.
- **Unauthorized Payment Recording:** Strictly guarded by `requireAdmin()`.

## 23. Observability
- **Audit Data:** `OrderEvent` and `PaymentRecord` serve as the absolute financial audit trail.
- **Application Logging:** Standard logging for transaction failures, idempotency conflicts, and outbox worker dispatches. No PII in application logs.

## 24. Test Strategy
- **UNIT:** Validation bounds for amounts and balances.
- **TRANSACTION:** Assert all 5 mutations (Payment, Order, Event, Document, Outbox) commit together or roll back together.
- **CONCURRENCY:** 2 simulated simultaneous identical payments on the same order.
- **SECURITY:** Admin session mock passes, Guest session mock fails.
- **REGRESSION:** Ensure legacy orders with `advancePaid` don't lose value on new payment.

## 25. Adversarial Test Plan
1. Same idempotency key / same fingerprint.
2. Same idempotency key / different fingerprint.
3. Concurrent payments exceeding balance.
4. Synthetic throw immediately after PaymentRecord insert to verify Event/Document rollback.
5. Forged actor ID payload attempt.
6. Zero payment boundary.

## 26. Migration Analysis
**MIGRATION REQUIRED.**
Current schema is insufficient for `0005R1` constraints and safe legacy transitions.
- **Change 1:** Add `Order.legacyAdvancePaid Int @default(0)`.
- **Change 2:** Add `reference String?` to `PaymentRecord`.
- **Change 3:** Add `recordedById String?` to `PaymentRecord`.
- **Change 4:** Drop `@unique` from `bkashTrxId` (deprecate it).
- **Change 5:** Add `CASH` and `OTHER` to `PaymentMethod` enum.
*Note:* `idempotencyKey` is handled by the global `IdempotencyKey` model from Phase 4, so it is not needed on `PaymentRecord`.

## 27. Deployment Strategy
PHASE 5 SPECIFICATION APPROVAL → IMPLEMENTATION → MIGRATION REVIEW → TEST SUITE VALIDATION → MERGE → DEPLOY.

## 28. Risk Register
| Risk | Classification | Mitigation |
|---|---|---|
| Schema Migration Failure (Dropping bkashTrxId unique) | KNOWN | Pre-migration backup and local dry-run testing. |
| Duplicate Payments on Client Retry | KNOWN | Strict IdempotencyKey transaction integration. |
| Overpayment Race Conditions | KNOWN | `FOR UPDATE` lock serialization. |
| Double-Counting Legacy Orders | KNOWN | Use `legacyAdvancePaid` opening balance mechanism. |
| Missing Uniqueness on Digital Reference | KNOWN | Application layer validates `MANUAL_BKASH` and `BANK_TRANSFER`. |

## 29. Open Decisions
*(All human decisions have been formally approved)*

## 30. Acceptance Criteria
- Prisma schema migrated without data loss (`legacyAdvancePaid` successfully bootstrapped).
- `recordPayment` action executes atomically.
- Concurrent overlapping payments never result in a negative `balanceDue`.
- Idempotency replays identical client UUIDs correctly without double-charging, correctly rejecting mismatched payloads.
- A PDF snapshot document and Event are perfectly aligned with every payment.
- Guest/Unauthorized requests are rejected at the edge.
- New payments on CANCELLED/REJECTED orders are gracefully rejected.

## 31. Definition of Done
- Implementation complete, tested against adversarial suite.
- Migration applied.
- All Phase 5 business rules rigorously adhered to.
- Feature merged and deployed successfully.

## 32. Explicit Implementation Gate

PAYMENT LEDGER IMPLEMENTATION:
BLOCKED

IMPLEMENTATION MAY BEGIN ONLY AFTER:
1. Specification review completed.
2. All required business decisions resolved.
3. 0015 approval explicitly granted by human.
4. Implementation gate opened.
