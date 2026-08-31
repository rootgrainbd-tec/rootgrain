# Phase 8 Slice 2 — Safe Payment Voiding
## Detailed Implementation Plan

### 1. Objective
Design and implement the "Safe Payment Voiding" feature for Phase 8. This slice will allow an authorized Admin to safely void an eligible payment, immediately recalculating the authoritative `Order` financial state (e.g., `advancePaid`, `balanceDue`) without corrupting existing records, and leaving a deterministic audit trail, protected by the new granular RBAC engine.

### 2. Authoritative Sources
- **`0019-phase5a-admin-payment-operations-specification.md`**: Defines voiding as a core administrative operation.
- **`0082-phase8-slice1-rbac-implementation-plan-r1.md`**: Dictates the usage of `requirePermission("payment.void")`.
- **`src/services/payment.service.ts`**: The canonical reference for existing row locking, idempotency, and financial recalculation semantics.

### 3. Repository Audit Findings
- `PaymentRecord` model stores all payments.
- Existing `PaymentStatus` enum: `INITIATED`, `COMPLETED`, `FAILED`, `REFUNDED`. It **lacks** `VOIDED`.
- Payment capture currently immediately marks records as `COMPLETED`. 
- Order financial recalculation dynamically derives `advancePaid` by summing all `COMPLETED` payments. 
- Payment methods (`MANUAL_BKASH`, `BANK_TRANSFER`, `COD`) are manual/reconciliation-based. No external gateway API is wired for these payment mutations.

### 4. Payment Architecture
The existing architecture does not use a balance delta (e.g., `balanceDue += voidedAmount`). Instead, it uses authoritative recalculation:
1. `payment.status` is mutated.
2. `advancePaid` is completely re-calculated as `legacyAdvancePaid + SUM(COMPLETED payments)`.
3. `balanceDue` is re-calculated as `total - advancePaid`.

This provides inherent safety against double-adjustments.

### 5. Payment State Machine
Transitions to `VOIDED`:
- `INITIATED` → `VOIDED` (Allowed)
- `COMPLETED` → `VOIDED` (Allowed)

Transitions NOT allowed:
- `FAILED` → `VOIDED` (Already failed, cannot void)
- `REFUNDED` → `VOIDED` (Already refunded, distinct financial meaning)
- `VOIDED` → `VOIDED` (Already voided)
- `VOIDED` → `COMPLETED` (Void is strictly **irreversible**)

### 6. Void Eligibility Table

| Current Status | Voidable? | Reason / Constraint |
|----------------|-----------|---------------------|
| `INITIATED` | ✅ Yes | Cancels a pending manual entry. |
| `COMPLETED` | ✅ Yes | Cancels a captured entry, reverts financials. |
| `FAILED` | ❌ No | Logically disjoint; failure is not a void. |
| `REFUNDED` | ❌ No | Already reconciled as a refund. |
| `VOIDED` | ❌ No | Idempotent/terminal state. |

### 7. RBAC Integration
- **Gate**: `requirePermission("payment.void")` MUST be invoked at the top of the Server Action.
- **Bypass**: None. `session.role === "ADMIN"` alone will **not** be used or accepted in this new action.

### 8. Service Design
We will introduce `PaymentService.voidPayment()` to extend existing architecture without duplication:
- **Inputs**: `{ paymentRecordId: string, idempotencyKey: string, actorId?: string }`
- **Output**: The updated `PaymentRecord`.
- **Validation**: Ensure record exists, order is not strictly immutable (e.g., shipped/closed, unless allowed), and status is eligible.
- **Error Behavior**: Throws strict `AppError` on conflict, lock timeout, or illegal state transition.

### 9. Transaction
- Wrapped in `prisma.$transaction(async (tx) => { ... })` with `ReadCommitted` isolation level.

### 10. Row Locking / Concurrency Strategy
- To prevent concurrent voids or simultaneous payment additions, we must acquire a row lock on the **Order**:
  `SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`
- This ensures any concurrent execution (Payment Addition, Voiding, Price Revision) is serialized per order.

### 11. Idempotency Strategy
- Use existing `IdempotencyKey` architecture.
- **Scope**: `void_payment`
- **OwnerType**: `USER`
- **Fingerprint**: `${paymentRecordId}`
- If same key arrives, deterministic replay is provided via `existingKey.responsePayload`.

### 12. Financial Semantics (Authoritative Formula)
When a payment is voided, it loses its `COMPLETED` status. The service will run the identical formula used in payment creation:
1. `newAdvancePaid = Order.legacyAdvancePaid + SUM(PaymentRecord.amount WHERE orderId = ID AND status = 'COMPLETED')`
2. `newBalanceDue = Order.total - newAdvancePaid`

*Note: `Order.total` and `Order.requiredAdvance` remain strictly unchanged.*

### 13. Audit Event
- **Event Type**: `PAYMENT_VOIDED`
- **Payload**: `{ paymentRecordId, amount, method, reference, previousStatus: "COMPLETED", newStatus: "VOIDED" }`
- **Actor**: Resolved from `getServerSession()` or `actorId` override.

### 14. Gateway Boundary
> [!IMPORTANT]
> RootGrain's payment tracking currently utilizes manual reconciliation (`MANUAL_BKASH`, `BANK_TRANSFER`, `COD`). There is no active payment gateway SDK (e.g., Stripe, bKash API) executing captures or voids automatically in the backend. 
- **Boundary Declaration**: This void operation is strictly a **local financial state change**. It does NOT trigger a reverse network request to bKash or a bank. 

### 15. Admin UI
- **Location**: Within the Order Details view (`/admin/orders/[id]`), inside the Payment History list.
- **Trigger**: A "Void" button/icon on eligible (`COMPLETED`/`INITIATED`) payment rows.
- **Confirmation**: A destructive confirmation modal (e.g., "Are you sure? This will remove this payment from the order balance.").
- **Client Input**: The client will ONLY submit `paymentRecordId` and `idempotencyKey`. It will **not** submit amounts or statuses.

### 16. Security Checks
- **Spoofing**: The server derives `orderId`, `amount`, `status`, and `type` solely from the database using the provided `paymentRecordId`.
- **Identity**: Unauthenticated, standard `USER`, or Admins lacking the explicit `payment.void` permission are rejected `403`.

### 17. Database Impact
> [!WARNING]
> **SCHEMA CHANGE REQUIRED**
> The `PaymentStatus` enum must be updated to include `VOIDED`.
> **Migration Risk**: Low. Appending a value to a Postgres enum (`ALTER TYPE "PaymentStatus" ADD VALUE 'VOIDED'`) is a safe, forward-only operation that does not lock the table or rewrite data.

### 18. Test Matrix
1. **AUTH 1**: Unauthenticated request rejected (401).
2. **AUTH 2**: `USER` role rejected (403).
3. **AUTH 3**: `ADMIN` without `payment.void` rejected (403).
4. **AUTH 4**: `ADMIN` with `payment.void` allowed.
5. **ELIGIBILITY 1**: `COMPLETED` payment successfully voids.
6. **ELIGIBILITY 2**: Already `VOIDED` payment rejected.
7. **ELIGIBILITY 3**: `REFUNDED` payment rejected.
8. **ELIGIBILITY 4**: `FAILED` payment rejected.
9. **FINANCE 1**: Order `advancePaid` strictly decreases by exact payment amount.
10. **FINANCE 2**: Order `balanceDue` strictly increases by exact payment amount.
11. **FINANCE 3**: Order `total` and `requiredAdvance` are entirely unchanged.
12. **CONCURRENCY 1**: Two concurrent void requests on the same payment result in exactly one success, one conflict error, and one exact financial adjustment.
13. **IDEMPOTENCY 1**: Replaying the identical idempotency key returns the deterministic success response without double-voiding.
14. **IDEMPOTENCY 2**: Submitting a new idempotency key for the same payment fails cleanly (Already Voided).
15. **SECURITY 1**: Spoofed amounts or statuses in the network payload are impossible (inputs not accepted).
16. **REGRESSION**: Phase 7 Custom Order interactions remain fully intact.

### 19. Acceptance Criteria
- [ ] `payment.void` RBAC enforcement is active.
- [ ] Concurrency/Row lock is implemented.
- [ ] Authoritative financial recalculation avoids negative balances and double math.
- [ ] `PAYMENT_VOIDED` event is appended to `OrderEvent`.
- [ ] Local boundary is respected (no mock API calls).
- [ ] Test matrix executes cleanly.

### 20. Explicit Out-of-Scope
- Implementing Stripe/bKash API void integration.
- Advance Revision.
- Price Revision.

### 21. Open Decisions
- Should voiding a payment automatically trigger an Email Notification Outbox event to the customer? *(Recommendation: No, voiding is usually an administrative correction. Refunds trigger emails. Voids should be silent administratively, unless specified otherwise).*
