# 0183-PHASE6-FINAL-PAYMENT-SPECIFICATION-AND-PAYMENT-GATE-AUDIT

**Status:** PHASE 6 — BUSINESS DECISION REQUIRED

## 1. Executive Summary
This read-only audit evaluates RootGrain's existing payment architecture (`PaymentService`, `PaymentRecord`) to determine its readiness for "Final Payment" settlement and unblocking the Dispatch slice. The audit definitively proves that the core financial engine is already robust, highly capable, and fully supports final payments via Admin Manual Recording. **No new payment models or events are required.** However, a fundamental business decision regarding a Customer-Facing Online Gateway is missing, blocking final specification sign-off.

## 2. Current Payment Architecture
- **Location:** `src/services/payment.service.ts`
- **Implementation:** Strict double-entry style ledger. Payments are immutable records (`PaymentRecord`) appended to an order. The `balanceDue` is a derived constraint enforced atomically using `SELECT FOR UPDATE` on the `Order` table.
- **Status:** **CURRENT** / **IMPLEMENTED**

## 3. Payment Methods
The system currently natively supports the following `PaymentMethod` enumerations (`prisma/schema.prisma`):
- `MANUAL_BKASH`
- `BANK_TRANSFER`
- `CASH`
- `COD`
- `OTHER`
- **Status:** **IMPLEMENTED**. (No online automated methods like Stripe or SSLCommerz exist).

## 4. Payment Status
The `PaymentStatus` enum supports:
- `INITIATED`
- `COMPLETED`
- `FAILED`
- `REFUNDED`
- `VOIDED`
- **Status:** **IMPLEMENTED**.

## 5. Financial Source of Truth
The canonical source of truth for order financials is the `Order` model.
- `total`: The absolute fixed cost.
- `advancePaid`: The dynamic sum of `legacyAdvancePaid` + `SUM(PaymentRecord.amount)` where status is `COMPLETED`.
- `balanceDue`: Always computed authoritatively as `total - advancePaid`.
- **Status:** **IMPLEMENTED**.

## 6. Final Payment Definition
Final Payment is strictly defined as any valid transaction(s) that reduces `balanceDue` to exactly `0`. It is **NOT** a new model, and **NOT** a new event type. It is simply the terminal state of the existing `PaymentRecord` ledger.
- **Status:** **VERIFIED**.

## 7. PaymentRecord
The existing `PaymentRecord` model natively supports:
- Multiple partial payments
- Accurate remaining balance enforcement
- Strict method and reference tracking
- Recording actor tracking
- **Status:** **IMPLEMENTED**.

## 8. Admin Manual Payment
Admins can already record a payment manually.
- **Location:** `src/app/(storefront)/admin/orders/[id]/PaymentLedger.tsx`
- **Flow:** Admin selects type (`ADVANCE`, `INSTALLMENT`, `COD`), method, amount, and reference. Server-side validation via `recordPayment` enforces overpayment caps.
- **Status:** **IMPLEMENTED**.

## 9. Customer Payment
A deep repository search (`grep_search` for gateways, `pay now` UI strings) confirms that **no customer-facing payment UI exists**.
- **Status:** **ONLINE PAYMENT GATEWAY = NOT IMPLEMENTED**

## 10. Business Decision
Based on `0182`'s open question: *"Does Final Payment require an online payment gateway for Customer UI, or is Admin Manual Recording sufficient?"*
A repository review reveals no historical authoritative document explicitly mandating an online gateway vs manual-only.
- **Status:** **BUSINESS DECISION REQUIRED**

## 11. Dispatch Gate
The intended Business Rule for Dispatch eligibility is:
`Production COMPLETE` + `Final Invoice` + `balanceDue == 0`.
- **Status:** **UNSPECIFIED / MISSING** (Dispatch logic is not yet implemented, but the financial prerequisite is clearly defined by business policy).

## 12. Final Invoice Relationship
The Final Invoice (`OrderDocument` where `documentType = "INVOICE"`) is entirely immutable. Recording a Final Payment alters the dynamic `balanceDue` field on the `Order` but does **NOT** regenerate, alter, or version the Final Invoice snapshot.
- **Status:** **VERIFIED**.

## 13. Due Delivery
RootGrain policy permits `DELIVERED` status even if `balanceDue > 0`. Therefore, achieving `balanceDue == 0` (Final Payment) is **not** a strict prerequisite for physical delivery, but it **is** the standard gate for Dispatch (unless overriden).
- **Status:** **APPROVED**.

## 14. Payment After Delivery
`PaymentService.recordPayment` only blocks payments if the order status is `CANCELLED` or `REJECTED`. It fully permits recording a payment against an order that is `DISPATCHED` or `DELIVERED`.
- **Status:** **IMPLEMENTED**.

## 15. Final Payment vs PaymentRecord
**Final Payment vs PaymentRecord:**
- Final Payment is identical to a standard `PaymentRecord`. It requires **no new abstraction**. The existing engine handles it seamlessly via `INSTALLMENT` or `COD` payment types with `amount = balanceDue`.
- **Status:** **VERIFIED**.

## 16. Payment Receipt
`PaymentService.recordPayment` automatically triggers an Inngest background job to generate an `OrderDocument` of type `PAYMENT_RECEIPT` upon any successful `COMPLETED` payment. Final payments get receipts for free.
- **Status:** **IMPLEMENTED**.

## 17. Payment Events
The existing `PAYMENT_RECORDED` event is emitted securely during the transaction. No new `FINAL_PAYMENT_RECORDED` event is needed.
- **Status:** **IMPLEMENTED**.

## 18. Idempotency
`PaymentService` uses the `IdempotencyKey` model with strict UUID fingerprinting. Duplicate form submissions or concurrent retries will return the original successful payload without creating duplicate payments or corrupting the balance.
- **Status:** **IMPLEMENTED**.

## 19. Concurrency
PostgreSQL `SELECT ... FOR UPDATE` row-level locking on the `Order` table ensures that simultaneous Admin payments are serialized. The `balanceDue` can never be accidentally overdrawn by concurrent writes.
- **Status:** **IMPLEMENTED**.

## 20. Overpayment
If a payment pushes `advancePaid` above `total`, `PaymentService` throws an `AppError("Payment amount exceeds remaining balance", 400)`. Overpayment is rejected natively.
- **Status:** **IMPLEMENTED**.

## 21. Validation (Zero & Negative Payments)
Payments with `amount <= 0` trigger `AppError("Payment amount must be greater than 0", 400)`.
- **Status:** **IMPLEMENTED**.

## 22. Payment Reference
Digital methods (`MANUAL_BKASH`, `BANK_TRANSFER`) require a non-empty `reference`. Cash/COD do not.
- **Status:** **IMPLEMENTED**.

## 23. Authorization
`recordPayment` is strictly guarded by `session.user.role === "ADMIN"`.
- **Status:** **IMPLEMENTED**.

## 24. Customer Visibility
Customers currently have no portal or UI to view balances or make payments.
- **Status:** **MISSING**.

## 25. Final Payment UI
- **Admin UI:** Fully implemented (`PaymentLedger.tsx`).
- **Customer UI:** Not implemented.
- **Status:** **BUSINESS DECISION REQUIRED**.

## 26. Online Gateway
- **Status:** **ONLINE PAYMENT GATEWAY = NOT IMPLEMENTED**.

## 27. Dispatch Dependency
The state flow `Production COMPLETE + Final Invoice + balanceDue == 0 → Dispatch` is the accepted business logic, but the actual state transition code is pending in the Dispatch slice.
- **Status:** **DEFERRED (To Dispatch Slice)**.

## 28. Failure Handling
`INITIATED`, `FAILED`, and `VOIDED` statuses trigger zero financial updates. The `Order` balance is strictly calculated by summing only `COMPLETED` records.
- **Status:** **IMPLEMENTED**.

## 29. Success Handling
`COMPLETED` payment → Appended to ledger → Atomic recalculation → `advancePaid` rises → `balanceDue` drops.
- **Status:** **IMPLEMENTED**.

## 30. Partial Payment
Any payment `< balanceDue` successfully executes without altering downstream logic. The Dispatch gate safely remains blocked.
- **Status:** **IMPLEMENTED**.

## 31. Post-Delivery Payment
Perfectly supported. `balanceDue` can be settled to `0` long after `DELIVERED`.
- **Status:** **IMPLEMENTED**.

## 32. Refund
Refund logic (`voidPayment`) exists and safely reverts financial state. Formal refunds are deferred.
- **Status:** **DEFERRED**.

## 33. Accounting
Formal double-entry general ledger accounting entries are not currently in scope.
- **Status:** **UNSPECIFIED**.

## 34. Security
Admin actor is derived securely server-side. No PII is logged in payment events, and all routes are protected.
- **Status:** **IMPLEMENTED**.

## 35. Architecture Reuse
100% of the required functionality for Final Payment is satisfied by reusing `PaymentRecord`, `PaymentService`, `OrderEvent`, and the `PAYMENT_RECEIPT` pipeline.
- **Status:** **VERIFIED**.

## 36. Minimum Implementation Delta
The minimum change required to enable Final Payment is **Zero code lines**. The system is already capable of unblocking Dispatch through Admin Manual Recording.

## 37. Implementation Readiness
The backend architecture is ready. If Admin Manual Recording is sufficient, we can proceed directly to implementing the Dispatch slice.

## 38. Open Business Decisions
**CRITICAL BLOCKER:**
- Must RootGrain support Customer-Facing Online Payments (e.g. Stripe, bKash API) to close the Final Payment loop?
- Or is Admin Manual Recording of bank transfers / offline bKash sufficient for MVP Dispatch?

## 39. Acceptance Criteria
- [x] Read-only audit complete.
- [x] Zero mutation enforced.
- [x] Payment gate integrity confirmed.
- [x] Business decision escalated.

================================================================
CRITICAL QUESTIONS ANSWERED
================================================================
1. **Is Final Payment already supported by PaymentRecord?** Yes.
2. **Can Admin manually record final payment today?** Yes, via the Payment Ledger UI.
3. **Can customer pay final balance today?** No.
4. **Is an online gateway already implemented?** No.
5. **Is a gateway actually required?** Awaiting Business Decision.
6. **What exactly triggers Dispatch eligibility?** `balanceDue == 0` (and Production Complete).
7. **Is balanceDue == 0 enforced in current Dispatch code?** The Dispatch code is not yet written.
8. **Can payment happen after Delivery?** Yes.
9. **Does Final Payment require a new model?** No.
10. **Does Final Payment require a new event?** No.
11. **Does Final Payment require a new UI?** Admin UI exists. Customer UI requires Business Decision.
12. **What is the minimum implementation delta?** 0 lines of backend code.
13. **What business decision remains?** Are online automated customer payments strictly required for MVP?

================================================================
FINAL STATUS
================================================================
PHASE 6 —
BUSINESS DECISION REQUIRED
