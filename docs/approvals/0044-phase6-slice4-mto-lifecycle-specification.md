# PHASE 6 — SLICE 4
**INVOICE / PAYMENT / FULFILLMENT LIFECYCLE ARCHITECTURE & APPROVAL**
*Revision 1*

## 1. Executive Summary
Phase 6 Slice 3 successfully introduced the Admin MTO Confirmation and Required Advance negotiation workflow, culminating in the order transitioning to the `CONFIRMED` state with a 48-hour payment deadline. The subsequent challenge is defining the exact business and technical transitions that occur once the customer pays this advance.

This document proposes establishing **Slice 4** strictly around the **Advance Payment Lifecycle & Manufacturing Handoff**, while formally deferring Invoice/Accounting synchronization and Downstream Fulfillment to subsequent Slices.

## 2. Current Architecture
- **OrderStatus:** Supports `PENDING_ADVANCE`, `CONFIRMED`, `PROCESSING`, `DISPATCHED`, `DELIVERED`, `CANCELLED`, `REJECTED`.
- **ProductionState:** Supports `NOT_STARTED`, `IN_PROGRESS`, `COMPLETE`.
- **TrackingState:** Supports `PENDING_PRODUCTION`, `IN_PRODUCTION`, `QUALITY_CHECK`, `DISPATCHED`, `OUT_FOR_DELIVERY`, `DELIVERED_AND_COLLECTED`.
- **PaymentService:** `recordPayment` strictly updates the financial totals and generates a `PaymentRecord`, but **does NOT** mutate `Order.status`.
- **RBAC:** All operational duties are currently funneled through `Role.ADMIN`.

## 3. Slice 3 Boundary
Slice 3 ended with the Order resting in the `CONFIRMED` state with an established `requiredAdvance`. It implemented robust concurrency locks around the negotiation of this advance and automated expiry if the payment deadline is missed.

## 4. Payment Ledger Authority
The **Payment Ledger** is the authoritative source for payment verification. 
For deciding if production can start, the system must NOT rely solely on `Order.advancePaid` as the source of truth, as it is a cached financial snapshot. Instead, the transaction must verify that the sum of completed payments in the authoritative Payment Ledger is `>= requiredAdvance`. 
*Note: `PaymentService` will remain unmodified. No duplicate payment totals will be created.*

## 5. MTO-Only Boundary
Slice 4 is **STRICTLY** for orders where `isMtoOrder = true`. Standard eCommerce orders MUST remain completely untouched. No shared production workflow will be introduced in Slice 4.

## 6. Manufacturing Handoff: Start Production
The transition to begin manufacturing requires an explicit Admin action. No automated transition triggers occur upon payment.

**Start Production - Exact Transition:**
1. **Transaction Begins:** `SELECT ... FOR UPDATE Order`
2. **Re-check Preconditions:**
   - `isMtoOrder = true`
   - `Order.status = CONFIRMED`
   - `ProductionState = NOT_STARTED`
   - Authoritative Payment Ledger `paid amount` >= `requiredAdvance`
3. **State Transitions:**
   - `Order.status` = `PROCESSING`
   - `ProductionState` = `IN_PROGRESS`
   - `TrackingState` = `IN_PRODUCTION`
4. **Audit & Notification:**
   - Append `OrderEvent` = `PRODUCTION_STARTED`
   - Insert into `NotificationOutbox` = `PRODUCTION_STARTED` (Customer timeline visibility reflects this event).
5. **COMMIT** (No payment record is created by this action).

## 7. Production Completion
Once manufacturing concludes, an Admin triggers completion. 

**Complete Production - Exact Transition:**
1. **Transaction Begins:** `SELECT ... FOR UPDATE Order`
2. **Re-check Preconditions:**
   - `isMtoOrder = true`
   - `Order.status = PROCESSING`
   - `ProductionState = IN_PROGRESS`
3. **State Transitions:**
   - `ProductionState` = `COMPLETE`
   - `TrackingState` = `QUALITY_CHECK`
   - `Order.status` **REMAINS** `PROCESSING`
4. **Audit:**
   - Append `OrderEvent` = `PRODUCTION_COMPLETED` (No new notification system will be created for this. If existing timelines support displaying `OrderEvent`, it may be surfaced there.)
5. **COMMIT** (Stop here. QC logic belongs to a future Slice).

## 8. Concurrency & Payment Race Conditions
All administrative transitions use explicit `SELECT ... FOR UPDATE` locking to prevent race conditions.
If a **Customer Payment** and **Start Production** occur concurrently, the Payment Ledger remains authoritative. 
The "Start Production" lock ensures the order row is locked, and the authoritative ledger sum is explicitly re-calculated *after* acquiring the lock, guaranteeing the exact real-time financial state is validated. The client UI state is never trusted as authoritative.

## 9. Future Boundary (Deferred Capabilities)
The following capabilities are formally out-of-scope for Slice 4 and deferred to future Slices:
- **Invoice / Accounting:** (Slice 5)
- **QC / Evidence / Rework:** (Future)
- **Dispatch:** (Future)
- **Delivery:** (Future)
- **Tracking:** Beyond `IN_PRODUCTION` / `QUALITY_CHECK` (Future)
- **Refunds:** (Future, unless already supported natively by existing architecture)

## 10. Database / Schema Impact
**No Prisma schema changes are required.**
An audit of `schema.prisma` confirms that both `eventType` in `OrderEvent` and `notificationType` in `NotificationOutbox` are defined as `String` (not restricted Enums). Therefore, the new event strings `PRODUCTION_STARTED` and `PRODUCTION_COMPLETED` can be appended immediately without requiring any database migrations.

## 11. Acceptance Criteria

### Start Production
- MTO only (`isMtoOrder = true`).
- `CONFIRMED` only.
- `NOT_STARTED` production only.
- Payment Ledger >= Required Advance.
- `FOR UPDATE` lock strictly applied.
- `Order.status` -> `PROCESSING`.
- `ProductionState` -> `IN_PROGRESS`.
- `TrackingState` -> `IN_PRODUCTION`.
- `PRODUCTION_STARTED` OrderEvent appended.
- `PRODUCTION_STARTED` NotificationOutbox appended.

### Complete Production
- MTO only (`isMtoOrder = true`).
- `PROCESSING` only.
- `IN_PROGRESS` only.
- `FOR UPDATE` lock strictly applied.
- `ProductionState` -> `COMPLETE`.
- `TrackingState` -> `QUALITY_CHECK`.
- `Order.status` remains `PROCESSING`.
- `PRODUCTION_COMPLETED` OrderEvent appended.
- No QC implementation.

### Regression
- Standard orders remain completely unchanged.
- Slice 3 workflows remain completely unchanged.
- `PaymentService` remains untouched.
- `Invoice Engine` remains untouched.

---

**STATUS: AWAITING APPROVAL**
