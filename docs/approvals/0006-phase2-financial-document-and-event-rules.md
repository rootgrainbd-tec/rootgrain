# 0006-PHASE2-FINANCIAL-DOCUMENT-AND-EVENT-RULES

**Document:** docs/approvals/0006-phase2-financial-document-and-event-rules.md
**Status:** AWAITING EXPLICIT APPROVAL

## 1. PURPOSE
This document serves as the canonical Business, Financial, Document, and Event Contract Freeze for RootGrain Phase 2. It consolidates all previously approved rules, technical architectures, and financial formulas into ONE implementation-ready contract.

## 2. SCOPE
The scope includes the financial lifecycles, payment workflows, Made-to-Order (MTO) workflows, Custom Order requests, Delivery TBD logic, Document issuance (Confirmations, Receipts, Invoices, Revisions), Idempotency, and the atomic Event/Outbox notification architecture.

## 3. CURRENT SYSTEM CONTEXT
Based on the approved Phase 1 Compatibility Audit (`0007-phase1-existing-system-compatibility-audit.md`), the current system facts are:
- **Normal Order / Checkout:** Exists, but requires refactoring.
- **Payment Model:** Foundation exists (empty `PaymentRecord` model).
- **Payment Workflow:** MISSING (no APIs, validation, receipts, or histories).
- **MTO:** MISSING.
- **Custom Order:** MISSING.
- **Wishlist Toggle:** Buggy (silent upsert failures).
- **Buy Now:** Not implemented (but existing checkout logic is reusable).
- **NotificationOutbox:** MISSING (current emails are inline and un-awaited).
- **Runtime DB State:** Not independently verified.
**Important:** The target functionality defined in this Phase 2 contract DOES NOT already exist. It must be strictly implemented in subsequent phases.

## 4. BUSINESS TERMS
- **Custom Request:** An inquiry submitted by a customer for bespoke production. It is NOT an Order.
- **Commercial Terms:** The final agreed configuration (price, advance, specs) for a custom/MTO request.
- **Made-to-Order (MTO):** A product that requires a manufacturing lifecycle after payment of a required advance.
- **Payment Type:** A business/lifecycle classification of payment (e.g., ADVANCE, INSTALLMENT, COD).
- **Payment Method:** The technical collection mechanism (e.g., Credit Card, bKash).

## 5. FINANCIAL DEFINITIONS
- **Current Product Price:** The baseline price of the items plus any additive revisions.
- **Known Current Payable:** The current subtotal of the items minus any locked discounts.
- **Final Payable:** The final sum (including final delivery charge) locked at Final Invoice.
- **Valid Paid:** SUM(amount of payments whose current status = COMPLETED).
- **Current Balance:** The difference between the applicable payable (known or final) and Valid Paid. Current Balance MUST NOT be interpreted as a negative customer debt.
- **OVERPAID AMOUNT** = Valid Paid - Applicable Payable.

## 6. FINANCIAL FORMULAS
- **Current Product Price** = Base Product Price + SUM(all Price Adjustments)
- **Known Current Payable** = Current Product Price - Locked Discount
- **When Delivery State = TBD:** Final Payable = UNKNOWN
- **When Delivery State = FINALIZED:** Final Payable = Current Product Price - Locked Discount + Final Delivery Charge
- **Valid Paid** = SUM(amount of payments whose current status = COMPLETED)
- **Current Balance** = Applicable Payable - Valid Paid

*(Note: Delivery TBD is NEVER mathematically treated as 0. Historical documents must not be reconstructed from mutable Product.price; they must use snapshotted values).*

## 7. OVERPAYMENT POLICY & REQUIRED ADVANCE
- **Suggested Advance:** A system recommendation/default.
- **Required Advance:** The actual agreed advance requirement for this specific Order. It is NOT automatically 20%; it may be any agreed amount (e.g., ৳100, ৳10,000).
- **Advance Paid:** SUM(COMPLETED payments where Payment Type = ADVANCE).
- **Advance Requirement Fulfilled:** Evaluates to `true` when Advance Paid >= Required Advance.
- **Overpayment Policy (Mandatory):** 
  - **Required Advance:** Excess advance is explicitly ALLOWED.
  - **Other payments (Pre-Final and Post-Final):** A payment amount MUST NOT cause Valid Paid to exceed the applicable payable. Overpayment attempts are REJECTED before completion unless the payment is explicitly classified as an allowed excess/credit.
  - Do NOT silently create a negative Balance as a normal financial state.

## 8. PAYMENT TYPES
Payment Types dictate the lifecycle and business meaning of the payment. The frozen types are:
- **ADVANCE**
- **INSTALLMENT**
- **COD**
*(Phase 2 strictly isolates Payment Type from Payment Method. No other payment types shall be invented).*

## 9. PAYMENT LIFECYCLE & VALIDATION
Payment validation must dynamically evaluate the Payment Type, Order Lifecycle State, Delivery State, Final Invoice State, and Canonical Financial State.
- **ADVANCE:** Allowed Pre-production. NOT allowed Post Final Invoice or Post delivery.
- **INSTALLMENT:** Allowed during Active order, Pre-production, and Post Final Invoice. NOT allowed Post delivery.
- **COD:** Final payment mechanism. Allowed ONLY during `OUT_FOR_DELIVERY` or `DELIVERED_AND_COLLECTED`.
- **All Payments:** NOT allowed if Order is Cancelled/Rejected.

**Exact Amount Validation (Mandatory):**
Every payment MUST deterministically validate and calculate:
- amount > 0
- supported monetary precision and currency
- maximum allowed amount based on Applicable Payable
- Valid Paid before payment
- Valid Paid after payment
- Balance before payment
- Balance after payment
- Overpayment rejection (if amount > Balance before payment, except for allowed Advance excess).

## 10. PAYMENT VOID & RECEIPT BEHAVIOR
- A payment may only transition from `COMPLETED` → `VOIDED` via an authorized, atomic operation.
- **Workflow:** AUTHORIZATION → IDEMPOTENCY → FINANCIAL AGGREGATE LOCK → VALIDATE STATUS & REASON → MARK VOIDED → CREATE `PAYMENT_VOIDED` event → CREATE NotificationOutbox → COMMIT.
- **Aftermath:** A VOIDED payment MUST NOT contribute to Valid Paid. Valid Paid and Current Balance recalculate to exclude it. 
- **Receipt Behavior:** The original Payment Receipt MUST remain completely immutable. Historical receipt data MUST NOT be rewritten to change the original payment amount. Instead, the receipt remains visible but displays a VOIDED status/watermark to reflect the current state. (Do NOT create a new refund/void receipt workflow unless explicitly required later).

## 11. PRICE REVISION
- Price Revision is an additive adjustment: New Product Price = Current Product Price + Price Adjustment.
- **Workflow:** AUTHORIZATION → IDEMPOTENCY → FINANCIAL AGGREGATE LOCK → VERIFY Final Invoice NOT issued → READ Current Product Price → APPLY Adjustment → VALIDATE → CREATE immutable PRICE_REVISION snapshot → CREATE `PRICE_REVISED` event → CREATE NotificationOutbox → COMMIT.
- **Validation:** 
  - Delivery TBD: New Known Payable = New Product Price - Locked Discount.
  - Delivery Finalized: New Final Payable = New Product Price - Locked Discount + Final Delivery Charge.
  - The New applicable Payable MUST NOT fall below Valid Paid.
- **Lock:** Blocked after Final Invoice issuance.

## 12. REQUIRED ADVANCE REVISION
- Required Advance may be revised ONLY before Production starts. After Production starts: Required Advance Revision = BLOCKED.
- **Logging:** Every permitted revision must record: `oldRequiredAdvance`, `newRequiredAdvance`, `reason`, `actor`, `timestamp`.
- **Event:** Triggers `REQUIRED_ADVANCE_REVISED`. (Silent changes are prohibited).

## 13. DELIVERY
- Delivery may initially be `TBD` or `FINALIZED`.
- If `TBD`: Delivery Charge = unknown, Final Payable = unknown.
- If `FINALIZED`: Admin replaces the charge.
- **Replacement Semantics:** Old Delivery Charge → New Delivery Charge (Do NOT add the new charge to the old charge).
- **Workflow:** AUTHORIZATION → IDEMPOTENCY → FINANCIAL AGGREGATE LOCK → VERIFY Final Invoice NOT issued → READ canonical state → REPLACE Delivery Charge → VALIDATE New Payable >= Valid Paid → CREATE `DELIVERY_CHARGE_UPDATED` event → CREATE NotificationOutbox → COMMIT.
- **Lock:** Blocked after Final Invoice issuance.

## 14. NORMAL ORDER
- **Workflow:** AUTHORIZATION → IDEMPOTENCY → CREATE Order → CREATE immutable ORDER_CONFIRMATION snapshot → CREATE exactly ONE `ORDER_CREATED` event → CREATE NotificationOutbox → COMMIT.
- **Retry:** Same business operation retry returns the original result. No duplicate Order, Confirmation, Event, or Outbox.

## 15. CUSTOM REQUEST → ORDER
- A Custom Request is NOT an Order.
- **Lifecycle:** CUSTOM REQUEST → ADMIN REVIEW / DISCUSSION → COMMERCIAL TERMS → REQUIRED ADVANCE → ORDER CREATION → MTO LIFECYCLE.
- **Conversion Workflow:** AUTHORIZATION → IDEMPOTENCY → LOCK CustomRequest aggregate → VERIFY not already converted → CREATE Order → CREATE Order Confirmation → CREATE `ORDER_CREATED` event → CREATE NotificationOutbox → MARK CustomRequest converted → COMMIT.
- **Invariant:** One CustomRequest → maximum one Order. Customer approval is NOT a required extra workflow step after Admin sets terms. Concurrent conversions yield exactly one Order.

## 16. MTO STATE TRANSITION CONTRACT
The business lifecycle must explicitly separate states, and define irreversible transitions:
- **Commercial State**
- **Production State:** `NOT_STARTED` → `IN_PROGRESS` → `COMPLETE`. (COMPLETE cannot return to IN_PROGRESS).
- **Payment State:** `PENDING` → `COMPLETED` → `VOIDED`. (VOIDED cannot return to COMPLETED).
- **Delivery State:** `TBD` → `FINALIZED` → `OUT_FOR_DELIVERY` → `DELIVERED_AND_COLLECTED`.
- **Invoice State:** `NOT_ISSUED` → `ISSUED`. (ISSUED cannot return to NOT_ISSUED).
Do NOT collapse these into one single Order status. Do NOT invent reversal workflows.

## 17. ORDER CONFIRMATION
Order Confirmation is an immutable historical snapshot.
- **Frozen Fields:** Order Reference, Order Total at Creation, Base Product Price, Locked Discount, Suggested Advance, Required Advance, Advance Paid at Creation, Valid Paid at Creation, Balance at Creation, Delivery State, Customer Snapshot, Delivery Address Snapshot, Template Version, Created At.
- **Immutability:** This document MUST NOT change when products, addresses, or required advances are updated later.

## 18. PAYMENT RECEIPT
Payment Receipt is an immutable historical snapshot.
- **Delivery TBD Format:** Shows Known Product/Order Subtotal, Delivery = TBD, Final Order Total = Pending, Paid Before, Payment Amount, Paid After, Known Current Balance. (MUST NOT display Known Current Payable as Final Order Total).
- **Finalized Delivery Format:** Shows Current/Final Order Total, Paid Before, Payment Amount, Paid After, Balance After.

## 19. PRICE REVISION SNAPSHOT
Every Price Revision is historical and immutable.
- **Minimum Snapshot:** Revision ID, Order ID, Previous Product Price, Adjustment, New Product Price, Locked Discount, Delivery State, Known Payable / Final Payable, Valid Paid, Known/Current Balance, Reason, Actor, Timestamp.
- Multiple price revisions are allowed. It possesses a unique revision identity. (Do NOT enforce `UNIQUE(orderId, documentType)` for PRICE_REVISION).

## 20. FINAL INVOICE & FINANCIAL STATE
- **Issuance Rule:** Allowed ONLY when Production = COMPLETE AND Delivery = FINALIZED.
- **Zero Balance Rule:** Final Invoice issuance DOES NOT require Balance = 0 or Valid Paid = Final Payable. Final Invoice may be issued while an outstanding balance remains.
- **Workflow:** AUTHORIZATION → IDEMPOTENCY → FINANCIAL AGGREGATE LOCK → VERIFY Production Complete & Delivery Finalized → READ canonical state → CREATE immutable FINAL_INVOICE snapshot → CREATE exactly ONE `FINAL_INVOICE_ISSUED` event → CREATE NotificationOutbox → COMMIT.
- **Current vs Historical State:** The Final Invoice is a historical snapshot. Current Balance is a mutable derived financial state. (e.g., If Balance at Issuance = ৳70,000, and a later payment of ৳30,000 occurs, the Historical Final Invoice STILL reads Balance at Issuance = ৳70,000, while the Current Balance becomes ৳40,000). Do NOT confuse Balance At Issuance with Current Balance. The Final Invoice MUST NOT be rewritten.

## 21. EVENT PAYLOAD CONTRACTS (MANDATORY)
Minimum payload contracts that downstream consumers rely on (Do NOT reconstruct from mutable state):
- **ORDER_CREATED:** `orderId`, `orderReference`, `orderType`, `productOrderFinancialSnapshot`, `requiredAdvance`, `deliveryState`, `actor`, `occurredAt`.
- **PAYMENT_RECEIVED:** `eventId`, `orderId`, `paymentId`, `paymentType`, `paymentMethod`, `amount`, `paidBefore`, `paidAfter`, `validPaidAfter`, `applicablePayable`, `balanceAfter`, `actor`, `occurredAt`.
- **PAYMENT_VOIDED:** `eventId`, `orderId`, `paymentId`, `originalAmount`, `validPaidBefore`, `validPaidAfter`, `balanceBefore`, `balanceAfter`, `reason`, `actor`, `occurredAt`.
- **PRICE_REVISED:** `eventId`, `orderId`, `revisionId`, `previousProductPrice`, `adjustment`, `newProductPrice`, `lockedDiscount`, `deliveryState`, `applicablePayable`, `validPaid`, `balance`, `reason`, `actor`, `occurredAt`.
- **REQUIRED_ADVANCE_REVISED:** `eventId`, `orderId`, `oldRequiredAdvance`, `newRequiredAdvance`, `reason`, `actor`, `occurredAt`.
- **DELIVERY_CHARGE_UPDATED:** `eventId`, `orderId`, `previousDeliveryCharge`, `newDeliveryCharge`, `applicablePayable`, `validPaid`, `balance`, `actor`, `occurredAt`.
- **FINAL_INVOICE_ISSUED:** `eventId`, `orderId`, `invoiceId`, `finalProductPrice`, `totalAdjustments`, `lockedDiscount`, `finalDeliveryCharge`, `finalOrderTotal`, `validPaidAtIssuance`, `balanceAtIssuance`, `actor`, `occurredAt`.

## 22. EVENT SEQUENCE
- **Invariant:** `UNIQUE(orderId, sequence)`.
- **Allocation:** Must be concurrency-safe, transactional, deterministic, and idempotent. Idempotent retries after a successful commit MUST NOT allocate another sequence.

## 23. IDEMPOTENCY
- **Invariant:** `UNIQUE(scope, idempotencyKey)`.
- **Validation:** Same scope + same key + same request fingerprint → return original result. Same scope + same key + different fingerprint → `IDEMPOTENCY_CONFLICT`.
- **Transaction Rule:** Before commit → no durable mutation. Crash before commit → full rollback. After commit → financial mutation + document + event + outbox + idempotency result ALL commit together. Retry yields original result.

## 24. DATABASE INVARIANTS
- **Idempotency:** `UNIQUE(scope, key)`.
- **Final Invoice:** `UNIQUE(orderId) WHERE documentType = FINAL_INVOICE`.
- **Order Confirmation:** `UNIQUE(orderId) WHERE documentType = ORDER_CONFIRMATION`.
- **Payment Receipt:** `UNIQUE(paymentId) WHERE documentType = PAYMENT_RECEIPT`.
- **CustomRequest:** Maximum one Order.
- **OrderEvent:** `UNIQUE(orderId, sequence)`.
- **CustomerNotification:** `UNIQUE(recipientScope, orderId, eventSequence, notificationType, channel)`.
- **Price Revision:** Multiple allowed, NOT unique by documentType.
- **Financial Order Deletion:** Financial orders MUST NOT be hard-deleted. Schema-level `ON DELETE CASCADE` must not destroy financially material historical records.

## 25. LEGACY ORDER COMPATIBILITY
Existing historical orders must remain compatible without data fabrication.
- Do NOT fabricate historical events for old orders merely to populate the event system.
- New event history begins ONLY when a new lifecycle mutation occurs after the architecture is introduced.

## 26. NOTIFICATION OUTBOX IDEMPOTENCY / RETRY
- **Transaction:** Business Mutation + Event + NotificationOutbox = ONE atomic database transaction.
- **Identity:** Each Outbox record must have a unique identity.
- **Retry Semantics:** The worker must be safe to retry. If the worker crashes before external provider acceptance → retry allowed. After provider acceptance but before worker acknowledgement → retry MUST use provider-side idempotency where supported. Internal duplicate business events MUST NOT be created by worker retry.
- **Logical Mapping:** One business event → one logical Outbox message per notification type/channel. Multiple delivery attempts ≠ multiple business events.
- **Guarantee:** Do NOT promise exactly-once external delivery unless the provider actually guarantees it. Use at-least-once processing + idempotent delivery handling.

## 27. AUTHORIZATION & ACTOR MATRIX
Roles must strictly adhere to the following permitted capabilities. (No additional roles shall be invented).

| Operation | CUSTOMER | ADMIN | SYSTEM/WORKER |
| :--- | :--- | :--- | :--- |
| Create Payment | **YES** | **YES** | NO |
| Void Payment | NO | **YES** | NO |
| Revise Required Advance | NO | **YES** | NO |
| Revise Price | NO | **YES** | NO |
| Update Delivery Charge | NO | **YES** | NO |
| Convert CustomRequest | NO | **YES** | NO |
| Issue Final Invoice | NO | **YES** | NO |
| Create Confirmations/Receipts | NO | NO | **YES** |
| Create/Send Notification | NO | NO | **YES** |

## 28. CACHE
- **DATABASE** = Authoritative financial truth. Financial validation MUST use canonical DB state.
- **CACHE** = Derived/rebuildable.
- If DB commits successfully but the Cache update fails: the financial mutation remains valid, and the cache is repaired asynchronously.

## 29. FAILURE/RECOVERY
- **DB failure before commit / after transaction start:** Complete rollback.
- **External Failures (Email, WhatsApp, PDF generation):** Handled post-commit by the Outbox Worker via retry. Financial DB commit MUST NOT depend on successful external notification delivery.
- **Outbox Worker Crash:** Recoverable via scanning unprocessed Outbox rows.
- **Concurrent Requests / Admin Actions:** Resolved deterministically via DB Row Locks and Idempotency keys.

## 30. INTEGRATION TEST CONTRACT
The following future tests are required (but must NOT be implemented in Phase 2):
A. Required Advance = 10,000
B. Required Advance = 100
C. Delivery TBD + Paid equals Known Current Payable → NOT Fully Paid
D. Delivery finalized → Final Balance
E. Price Revision +20,000 after 80,000 paid
F. Concurrent Price Revision + Payment
G. Concurrent CustomRequest conversion
H. Same payment idempotency retry after commit
I. Concurrent Final Invoice issuance
J. Required Advance revision
K. Delivery TBD → Finalized
L. Payment Void → Valid Paid/Balance recalculation
M. Payment after Final Invoice → Final Invoice remains immutable
N. Price Revision after Final Invoice → BLOCKED
O. Delivery Update after Final Invoice → BLOCKED
P. Duplicate Order submission
Q. Duplicate payment submission
R. Duplicate notification delivery
S. Legacy order mutation compatibility
T. (Scen 11) Final Payable = 100k, Paid = 100k, Payment = 10k → REJECTED.
U. (Scen 12) Final Invoice Issued, later payment → Invoice unchanged, Current Balance decreases.
V. (Scen 13) Payment 10k then VOIDED → Valid Paid decreases, Receipt remains but marked VOIDED.
W. (Scen 14) Required Advance = 10k, Production started, Admin attempts revision → BLOCKED.
X. (Scen 15) Production COMPLETE, Delivery FINALIZED, Balance 70k → Final Invoice CAN be issued.
Y. (Scen 16) Final Invoice issued, Balance 70k, Customer pays 30k → Invoice unchanged, Current Balance 40k.
Z. (Scen 17) Outbox worker crashes before ACK → retry allowed, provider idempotency prevents external duplicate.

## 31. IMPLEMENTATION BOUNDARIES
This document finalizes the Contract Specification (Phase 2).
The actual technical application of this contract maps to:
- Phase 3: Repository & Data Architecture Mapping
- Phase 4: Database / Transaction Foundation

## 32. APPROVAL GATE

PHASE 2 GATE:
READY FOR TECHNICAL FOUNDATION APPROVAL

STATUS:
AWAITING EXPLICIT APPROVAL
