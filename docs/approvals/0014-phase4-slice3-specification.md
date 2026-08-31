# ROOTGRAIN — PHASE 4 → PHASE 5
# 0014 ARCHITECTURAL BOUNDARY DECISION AMENDMENT

## 1. Status
AWAITING APPROVAL

## 2. References
- `docs/approvals/0004-phase2-master-audit-and-implementation-plan.md`
- `docs/approvals/0005R1-financial-model-payment-architecture-freeze.md`
- `docs/approvals/0008-phase3-repository-data-architecture-mapping.md`
- `docs/approvals/0009-phase4-database-transaction-foundation.md`
- `docs/approvals/0013-phase4-slice2-implementation-plan.md`
- `docs/approvals/0013-phase4-slice2-implementation-final.md`
- `docs/approvals/0013-phase4-slice2-closure.md`

## 3. Current Baseline
Phase 4 Slice 2 is formally closed. The `20260818000000_phase4_slice2` Prisma migration is deployed. The repository now possesses the foundational primitives for Database Transactions, Order Aggregate Locking, Idempotency (`IdempotencyKey`), Events (`OrderEvent`), Documents (`OrderDocument`), and Notifications (`NotificationOutbox`).

## 4. Problem Statement
The Phase 4 objective was to establish the database and transaction foundation, which is now complete. The legacy master plans (`0004`, `0005R1`) dictate that the next logical step is "Payment Ledger Activation" (implementing the `recordPayment` transaction with concurrency locks and idempotency). However, the authoritative Phase 4 foundation specification (`0009` Section 23) strictly dictates: "PHASE 4 MUST NOT IMPLEMENT: Payment business workflow...". 

## 5. Goals
- Resolve the boundary explicitly: Phase 4 foundation is considered complete.
- Transition the project to Phase 5 for business workflow activation.
- Assign Payment Ledger Activation / `recordPayment` as a Phase 5 candidate workflow requiring its own Phase 5 specification and approval.

## 6. Non-Goals
- Implementing the Payment Business Workflow.
- Modifying the Prisma schema.
- Creating migrations or altering the database.
- Approving Payment Ledger Activation implementation. (This document only approves its assignment to Phase 5).

## 7. Scope
IN SCOPE:
- Phase 4 Foundation Completion Verification
- Phase 4 formal closure confirmation
- Phase 5 transition decision
- architectural boundary clarification

OUT OF SCOPE:
- Payment Ledger Activation implementation
- `recordPayment` implementation
- Payment workflow code
- Payment receipt generation
- notification delivery
- Price Revision
- CustomRequest
- unrelated business workflows

FUTURE PHASE:
- Phase 5 Payment Ledger Activation
- subsequent Phase 5 business workflows

## 8. Architecture (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
The architecture is at a boundary threshold. The underlying persistence and concurrency mechanisms exist but no service layer orchestrates them. 

## 9. Domain Model (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
Current State: `PaymentRecord` exists with `type PaymentType` (ADVANCE, INSTALLMENT, COD).
Target State (Next Workflow): A financial domain service that wraps the `Order` aggregate lock, creates `IdempotencyKey` records, calculates `Total Paid` and `Balance Due`, creates the `PaymentRecord`, creates an `OrderEvent`, and persists an `OrderDocument` receipt snapshot.

## 10. Database Impact
**DATABASE IMPACT: NO DATABASE CHANGE. NO MIGRATION. NO SCHEMA CHANGE.**
For the future Phase 5 Payment Ledger Activation, current analysis indicates no new models/schema changes are strictly required because `PaymentRecord` and required foundation structures already exist.
*However, the Phase 5 specification MUST independently verify schema sufficiency.*

## 11. Transaction Design (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
For the anticipated Payment Ledger workflow:
- BEGIN
- → READ/LOCK (Order aggregate via `FOR UPDATE`)
- → IDEMPOTENCY CHECK (`claimIdempotencyKey`)
- → BUSINESS MUTATION (Insert `PaymentRecord`, update `Order.advancePaid` / `balanceDue`)
- → EVENT (Insert `OrderEvent` for payment)
- → DOCUMENT (Insert `OrderDocument` for payment receipt snapshot)
- → OUTBOX (Insert `NotificationOutbox` for email receipt intent)
- → IDEMPOTENCY COMPLETION
- → COMMIT
Operations that MUST remain outside transaction: PDF rendering, Resend email dispatch, external network calls.

## 12. Concurrency Design (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
Possible races for the anticipated payment workflow:
- **Duplicate payment submissions:** Handled by `IdempotencyKey` matching fingerprint.
- **Concurrent same-Order payments:** Handled by `FOR UPDATE` lock serializing requests; second request recalculates balance dynamically.
- **Concurrent different-Order payments:** Proceed cleanly in parallel.
- **Transaction failure:** Rollback ensures no partial payment, event, or document remains.

## 13. Idempotency (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
For the anticipated payment workflow:
- **Owner:** Admin User ID (or `GUEST` if applicable).
- **Scope:** `record_payment`
- **Key:** Client-generated UUID for the payment attempt.
- **Fingerprint:** Hash of `orderId` and `amount`.
- **Conflict behavior:** If fingerprint mismatches, `IDEMPOTENCY_CONFLICT` is returned.
- **P2002 behavior:** Returns `IdempotencyClaimConflictSignal`, safely aborts transaction.

## 14. Order Events (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
Anticipated events:
- **Event Name:** `PAYMENT_RECORDED`
- **Trigger:** Admin records a payment.
- **Aggregate:** `Order`
- **Actor:** `ADMIN` (with ID and Name).
- **Payload Shape:** `{ paymentId, amount, method, reference, newBalance }`
- **Transaction Relationship:** Must commit atomically with the payment.

## 15. Documents (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
Anticipated documents:
- **Document Type:** `PAYMENT_RECEIPT`
- **Snapshot Purpose:** Immutable record of the order state and payment amount at the exact time of transaction.
- **ReferenceIdentity:** The `PaymentRecord.id`.
- **Immutable vs Mutable:** Strictly immutable once committed.

## 16. Notification Outbox (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
Anticipated outbox intents:
- **EventReference:** The `OrderEvent.id` of `PAYMENT_RECORDED`.
- **NotificationType:** `EMAIL_RECEIPT`
- **Channel:** `EMAIL`
- **Status:** `PENDING`
- **Delivery Ownership:** Out of scope for transaction; processed by async worker.

## 17. Authorization/Security (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
- **Trust Boundary:** Payment recording is strictly an internal Admin operation (`requireAdmin()` server action).
- **Actor Identity:** Server-derived from verified Admin session.
- **Cross-owner access:** Idempotency scopes must isolate Admin-initiated transactions from public operations.

## 18. Failure Semantics (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
| Failure | Expected Result | Rollback? | Retry? | Replay? |
|---------|-----------------|-----------|--------|---------|
| Validation failure (e.g. amt > balance) | Rejection | Yes | No | No |
| Duplicate idempotency key (same fingerprint) | Success response | Yes (of current tx) | No | Yes (replay result) |
| Fingerprint mismatch | Conflict Error | Yes | No | No |
| DB constraint failure | Raw Prisma Error | Yes | Yes (client) | No |

## 19. Testing Strategy (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
- **UNIT TESTS:** Calculation of `Total Paid` and `Balance Due`.
- **TRANSACTION TESTS:** Verify atomicity of Payment + Event + Document + Outbox.
- **CONCURRENCY TESTS:** Ensure two simultaneous payments on the same order calculate balance sequentially without lost updates.

## 20. Adversarial Test Plan (PROPOSED PHASE 5 DESIGN INPUT)
*PENDING PHASE 5 SPECIFICATION REVIEW. PENDING HUMAN APPROVAL.*
1. Simulate concurrent payment requests with the same idempotency key.
2. Simulate concurrent payment requests with different idempotency keys for the same order (verifying lock serialization and balance correctness).
3. Throw synthetic error immediately after `PaymentRecord` creation but before `OrderEvent` creation to ensure full rollback.
4. Verify P2002 on `PaymentRecord` ID creation does not leave orphaned Idempotency records.

## 21. Migration Strategy
No new Prisma migrations are anticipated for the Phase 4 to Phase 5 boundary transition. The Phase 5 specification must independently verify schema sufficiency.

## 22. Deployment Strategy
SPECIFICATION APPROVAL → PHASE 4 CLOSURE → PHASE 5 INITIATION.

## 23. Risk Register
| Risk | Probability | Impact | Mitigation | Detection |
|---|---|---|---|---|
| Business workflow logic bypassing Phase 5 specification | Low | High (Governance Failure) | Explicit implementation block until Phase 5 spec is approved | Audit review |

## 24. Open Questions
- None. The boundary conflict is explicitly resolved by assigning Payment Ledger Activation to Phase 5.

## 25. Required Human Decisions
**DECISION:** Approve the architectural transition from the completed Phase 4 Database/Transaction Foundation to Phase 5 Business Workflow Activation, with Payment Ledger Activation identified as the first Phase 5 candidate workflow.

## 26. Acceptance Criteria
- Phase 4 remains foundation-only and is formally complete. 
- Payment Ledger Activation is assigned to Phase 5. 
- No Payment implementation is authorized by this amendment.

## 27. Definition of Done
- The 0014 specification is approved.
- Project formally transitions to Phase 5.

## 28. Explicit Implementation Gate

PHASE 4:
FORMALLY COMPLETE / CLOSED

PHASE 5:
READY FOR SPECIFICATION / PLANNING

PAYMENT LEDGER ACTIVATION:
PHASE 5 CANDIDATE

PAYMENT IMPLEMENTATION:
BLOCKED

IMPLEMENTATION MAY BEGIN ONLY AFTER:
1. 0014 approval document explicitly approved by human (Transitioning to Phase 5).
2. A dedicated Phase 5 specification (e.g. `0015-phase5-payment-ledger-activation-specification.md`) is authored and approved.
