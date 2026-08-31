# 0184-PHASE6-DISPATCH-SPECIFICATION-AND-IMPLEMENTATION-READINESS

**Status:** PHASE 6 — DISPATCH SPECIFICATION READY FOR APPROVAL

## 1. Executive Summary
This document provides the authoritative specification for implementing the Dispatch slice. It defines the exact state transitions, business preconditions, and data requirements for moving an order from a completed production state into physical dispatch. Based on a forensic read-only audit, the core data model and state machine primitives (`OrderStatus`, `TrackingState`, `trackingNumber`, `trackingUrl`) are already in place. The implementation requires no new database tables, no external shipping provider integrations for the MVP, and adheres strictly to the simplified lifecycle (QC removed).

## 2. Current Dispatch Audit
A deep inspection of the repository reveals:
- **`DISPATCHED` state exists** natively in both `OrderStatus` and `TrackingState` enums.
- **`trackingNumber` and `trackingUrl` fields exist** directly on the `Order` model (added in 0181).
- **`DeliveryState` exists** (`OUT_FOR_DELIVERY`, `DELIVERED`), distinct from Dispatch.
- **No separate `Dispatch` table exists**, nor is one required.
- **No shipping/courier provider abstraction exists**.
- **Status:** **CURRENT** / **VERIFIED**

## 3. State Ownership
To avoid duplicate or conflicting state machines, state ownership is strictly defined:
- **Production Lifecycle:** Owned by `ProductionState` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETE`).
- **Logistical Tracking:** Owned by `TrackingState` (e.g., `IN_PRODUCTION` → `DISPATCHED` → `OUT_FOR_DELIVERY`).
- **Macro Order Status:** Owned by `OrderStatus` (e.g., `PROCESSING` → `DISPATCHED` → `DELIVERED`).
- **Physical Handover:** Owned by `DeliveryState`.
- *Note:* QC Lifecycle is **REMOVED**. Dispatch does not depend on `QualityInspection`, `QC PASS`, or `REWORK`.
- **Status:** **APPROVED**

## 4. Business Preconditions
For an order to be eligible for Dispatch, the following explicit gates must be satisfied:
1. `ProductionState === "COMPLETE"`
2. A Final Invoice exists.
3. `balanceDue === 0` (unless a formal COD exemption is active, but the canonical gate is 0).
4. `OrderStatus === "PROCESSING"`
5. `TrackingState === "IN_PRODUCTION"` (or `PENDING_PRODUCTION` for non-MTO if applicable).
- **Status:** **APPROVED**

## 5. Final Invoice Gate
Dispatch strictly requires that the Final Invoice has already been generated.
- **Condition:** The `OrderDocument` table must contain a record where `orderId = target_id` and `documentType = "INVOICE"`.
- **Constraint:** Dispatch must **NOT** regenerate, alter, or version the Final Invoice. It remains completely immutable.
- **Status:** **APPROVED**

## 6. Payment Gate
The canonical financial check to unblock Dispatch is:
- **Condition:** `order.balanceDue === 0`.
- **Constraint:** This must rely entirely on the authoritative `Order.balanceDue` integer field. Dispatch must **NOT** manually sum `PaymentRecord` entries or calculate payment status independently.
- **Status:** **APPROVED**

## 7. Due Delivery Rule
RootGrain policy explicitly permits `DELIVERED` status even if `balanceDue > 0` (e.g., for Cash on Delivery edge cases or post-delivery settlements). 
- **Rule:** The `balanceDue === 0` requirement is strictly a **DISPATCH** eligibility gate. Do not accidentally enforce it downstream for Delivery status updates, preserving the flexibility of the post-dispatch ledger.
- **Status:** **APPROVED**

## 8. Admin Dispatch
Administrators will execute dispatch manually via the Admin UI.
- **Capabilities:** Mark as dispatched, input `trackingNumber`, input `trackingUrl`, record internal dispatch notes.
- **Constraint:** Uses the existing architecture. No automated courier label generation is implemented.
- **Status:** **PROPOSED**

## 9. Customer Visibility
Customers will be able to see the dispatch event on their order tracking page.
- **Visible Data:** `trackingNumber`, `trackingUrl`, Dispatch Date (`OrderStatus` updated timestamp).
- **Constraint:** Internal admin notes and operational data must not be exposed.
- **Status:** **PROPOSED**

## 10. Tracking
The schema additions from 0181 (`trackingNumber`, `trackingUrl`) are completely sufficient for the MVP.
- **Constraint:** Do **NOT** add `trackingProvider`, `trackingStatus`, or a sub-system for `trackingEvents` unless authoritative requirements change. 
- **Status:** **APPROVED**

## 11. Shipping Provider
No shipping/courier abstraction exists in the codebase.
- **Rule:** Do **NOT** introduce one. MVP will rely on manual data entry of the tracking details provided by third-party logistics.
- **Status:** **APPROVED**

## 12. Dispatch Data Model
Existing `Order` fields and state enums are entirely sufficient.
- **Constraint:** Do **NOT** create a new `Dispatch` or `Shipment` database table.
- **Status:** **APPROVED**

## 13. Events
A new domain event payload must be recorded in the `OrderEvent` table.
- **Event Type:** `"ORDER_DISPATCHED"`
- **Payload:** `{ trackingNumber, trackingUrl, actor, timestamp }`
- **Constraint:** Reuses the existing `OrderEvent` model. Do not invent duplicate logging mechanisms.
- **Status:** **PROPOSED**

## 14. Notifications
Upon successful dispatch, the customer must be notified.
- **Mechanism:** Insert a record into `NotificationOutbox`.
- **Trigger:** The Outbox processor/Inngest will format and send the standard "Order Dispatched" email containing the tracking URL. 
- **Constraint:** Do not implement synchronous email dispatch within the transaction.
- **Status:** **PROPOSED**

## 15. Idempotency
Duplicate dispatch requests (e.g., double-clicks) must be prevented.
- **Mechanism:** Use the `IdempotencyKey` table with a strictly formatted key: `dispatch_order_{orderId}`.
- **Status:** **PROPOSED**

## 16. Concurrency
Concurrent dispatch attempts by multiple admins must be serialized.
- **Mechanism:** Implement PostgreSQL row-level locking using `SELECT ... FOR UPDATE` on the `Order` record at the start of the transaction.
- **Result:** Exactly one successful transition; no duplicate events or notifications.
- **Status:** **PROPOSED**

## 17. Authorization
- **Rule:** Only sessions where `session.user.role === "ADMIN"` may execute the Dispatch transition.
- **Status:** **APPROVED**

## 18. Invalid States
The system must aggressively block Dispatch if:
- Production `NOT_STARTED` or `IN_PROGRESS`
- Order `CANCELLED` or `REJECTED`
- Final Invoice is missing
- `balanceDue > 0`
- Order is already `DISPATCHED` or `DELIVERED`
- **Status:** **PROPOSED**

## 19. Payment After Dispatch
The Payment Ledger must remain active. If an adjustment or refund causes `balanceDue` to fluctuate after Dispatch, the `PaymentService` is permitted to operate. Dispatch **MUST NOT** freeze the payment ledger.
- **Status:** **APPROVED**

## 20. Payment After Delivery
Preserved. Admin can record payment (`PaymentRecord`) against a `DELIVERED` order to reduce `balanceDue` to `0`.
- **Status:** **APPROVED**

## 21. Final Invoice Immutability
After Dispatch, the Final Invoice snapshot remains strictly immutable. It cannot be regenerated, and its invoice number cannot change.
- **Status:** **APPROVED**

## 22. Order Status
- **Transition:** `PROCESSING` → `DISPATCHED`
- **Status:** **PROPOSED**

## 23. Tracking State
- **Transition:** `IN_PRODUCTION` → `DISPATCHED`
- **Constraint:** `READY_FOR_DISPATCH` is **NOT** required or introduced. QC is bypassed.
- **Status:** **PROPOSED**

## 24. Delivery State
- **Transition:** Dispatch does **NOT** modify `DeliveryState`. The Delivery slice will govern transitions into `OUT_FOR_DELIVERY` and `DELIVERED`.
- **Status:** **APPROVED**

## 25. Dispatch Data
Required payload from the Admin UI:
- `trackingNumber` (string, optional)
- `trackingUrl` (string, optional)
- `notes` (string, optional - stored in `OrderEvent` payload, not exposed to customer)
- **Status:** **PROPOSED**

## 26. Shipping Cost
The shipping/delivery charge is finalized during the Final Invoice generation.
- **Constraint:** Dispatch **MUST NOT** mutate the financial snapshot or alter the shipping cost.
- **Status:** **APPROVED**

## 27. Address
The shipping address must be derived from the authoritative `Order.deliveryAddress` JSON snapshot.
- **Constraint:** Do not query the mutable customer profile for the address.
- **Status:** **APPROVED**

## 28. Cancelled / Rejected
Orders in `CANCELLED` or `REJECTED` states are hard-blocked from Dispatch.
- **Status:** **APPROVED**

## 29. Returns / Refunds
Future domain. Not implemented in the Dispatch slice.
- **Status:** **DEFERRED**

## 30. Communication
- **Customer Email:** "Your order has been dispatched. Track your delivery here: [Tracking URL]."
- **Constraint:** Internal notes must not be leaked to the customer.
- **Status:** **PROPOSED**

## 31. Security
- Admin-only access.
- No credential or PII logging in application text logs.
- Safe SQL bindings via Prisma.
- **Status:** **APPROVED**

## 32. Transaction Boundary
The following must occur inside a single `$transaction`:
1. `SELECT FOR UPDATE` on Order.
2. State validations.
3. Update `Order` (`OrderStatus`, `TrackingState`, `trackingNumber`, `trackingUrl`).
4. Insert `OrderEvent`.
5. Insert `IdempotencyKey`.
6. Insert `NotificationOutbox` (if email triggers aren't already listening to the OrderEvent).
- **Status:** **PROPOSED**

## 33. Failure Model
- **Database Failure:** Transaction rolls back completely. Safe to retry.
- **Notification Enqueue Failure:** Rolls back transaction.
- **Email Delivery Failure (Resend API):** Handled asynchronously. Does **NOT** roll back the successful Dispatch.
- **Status:** **APPROVED**

## 34. Dispatch → Delivery
The subsequent conceptual state is Delivery. The Delivery slice will handle the physical tracking updates and final signature/confirmation. Delivery is **NOT** implemented in this slice.
- **Status:** **DEFERRED**

## 35. Test Matrix
The implementation PR must include comprehensive tests covering:
1. Valid dispatch transition (all preconditions met).
2. Missing Final Invoice rejection.
3. `balanceDue > 0` rejection.
4. `balanceDue === 0` acceptance.
5. Incomplete production rejection (`NOT_STARTED` / `IN_PROGRESS`).
6. `CANCELLED` order rejection.
7. `REJECTED` order rejection.
8. Duplicate dispatch block (Idempotency).
9. Concurrent dispatch simulation (Locking).
10. Unauthorized execution (Non-admin).
11. Optional `trackingNumber` handling.
12. Optional `trackingUrl` handling.
13. `OrderEvent` payload verification.
14. `NotificationOutbox` insertion verification.
15. Post-dispatch payment recording (success).
16. Post-delivery payment recording (success).
17. Final Invoice immutability check.
18. Delivery state isolation check.

## 36. State Matrix
| Production State | Final Invoice Exists | `balanceDue` | Order Status | Eligible for Dispatch? |
| :--- | :--- | :--- | :--- | :--- |
| `COMPLETE` | Yes | `0` | `PROCESSING` | **YES** |
| `IN_PROGRESS` | Yes | `0` | `PROCESSING` | NO (Production pending) |
| `COMPLETE` | No | `0` | `PROCESSING` | NO (Missing Invoice) |
| `COMPLETE` | Yes | `> 0` | `PROCESSING` | NO (Unpaid Balance) |
| `COMPLETE` | Yes | `0` | `CANCELLED` | NO (Cancelled) |
| `COMPLETE` | Yes | `0` | `DISPATCHED` | NO (Already dispatched) |

## 37. Minimum MVP
The absolute minimum implementation utilizes:
- **Existing Models:** `Order`, `OrderEvent`, `NotificationOutbox`, `IdempotencyKey`.
- **Existing Enums:** `OrderStatus.DISPATCHED`, `TrackingState.DISPATCHED`.
- **Existing Fields:** `trackingNumber`, `trackingUrl`.
No extra abstractions, shipping APIs, or new tables will be added.

## 38. Roadmap
- QC Lifecycle = **REMOVED**
- Final Payment Backend = **COMPLETE**
- Dispatch Specification = **READY**
- Delivery Specification = **UPCOMING**

================================================================
FINAL STATUS
================================================================
PHASE 6 —
DISPATCH SPECIFICATION READY FOR APPROVAL
