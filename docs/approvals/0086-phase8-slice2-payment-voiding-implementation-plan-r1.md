# Phase 8 Slice 2 — Safe Payment Voiding
## Detailed Implementation Plan (Revision 1)

### 1. Objective
Design and implement the "Safe Payment Voiding" feature for Phase 8. This slice will allow an authorized Admin to safely void an eligible payment. The operation uses dual semantic paths depending on the payment's current state, guarantees serialization through robust row locking, uses deterministic idempotency, and recalculates order financials safely, all protected by granular RBAC.

### 2. Authoritative Sources
- **`0019-phase5a-admin-payment-operations-specification.md`**: Defines voiding as a core administrative operation.
- **`0082-phase8-slice1-rbac-implementation-plan-r1.md`**: Dictates the usage of `requirePermission("payment.void")`.
- **`src/services/payment.service.ts`**: The canonical reference for row locking (`FOR UPDATE`), transaction boundary, idempotency structure, and financial formula calculation.

### 3. Repository Audit Findings
- The `PaymentRecord` model stores all payments.
- The `PaymentStatus` enum currently contains: `INITIATED`, `COMPLETED`, `FAILED`, `REFUNDED`. It **does not contain** `VOIDED`.
- The `OrderEvent.eventType` is a `String` column, meaning new event names (like `PAYMENT_VOIDED`) do not require a database migration.
- Existing Admin payment operations strictly lock the aggregate root (`Order`) via `SELECT FOR UPDATE` to serialize modifications.

### 4. Payment Architecture
RootGrain does not use delta increments for `advancePaid` or `balanceDue` (e.g., `balanceDue += voidedAmount`).
Instead, financial fields are completely re-calculated dynamically from the ground up:
1. The target `PaymentRecord.status` is mutated.
2. `advancePaid` is authoritatively recalculated by summing `legacyAdvancePaid` with all payments whose status is `COMPLETED`.
3. `balanceDue` is recalculated as `total - advancePaid`.

### 5. State Machine
**Permitted Transitions:**
- `INITIATED` → `VOIDED`
- `COMPLETED` → `VOIDED`

**Forbidden Transitions:**
- `FAILED` → `VOIDED` (Already failed, logically disjoint)
- `REFUNDED` → `VOIDED` (Already fully reversed via refund semantics)
- `VOIDED` → `VOIDED` (Idempotent/terminal)
- `VOIDED` → `COMPLETED` (Strictly irreversible)

### 6. INITIATED Semantics
**Path A:** `INITIATED` → `VOIDED`
- `PaymentStatus` changes to `VOIDED`.
- **Financial Deltas:** ZERO.
- `Order.advancePaid` **MUST NOT** change (because `INITIATED` was never included in the sum).
- `Order.balanceDue` **MUST NOT** change.
- `Order.total` **MUST NOT** change.
- `Order.requiredAdvance` **MUST NOT** change.

### 7. COMPLETED Semantics
**Path B:** `COMPLETED` → `VOIDED`
- `PaymentStatus` changes to `VOIDED`.
- **Financial Deltas:**
  - `Order.advancePaid` decreases by exact amount (recalculated).
  - `Order.balanceDue` increases by exact amount (recalculated).
- `Order.total` **MUST NOT** change.
- `Order.requiredAdvance` **MUST NOT** change.

### 8. RBAC
- **Gate**: `requirePermission("payment.void")` MUST be invoked at the top of the Server Action.
- **Enforcement**: The actor identity is derived entirely server-side from this authenticated session.
- **Bypass**: None. The temporary Phase 5A `session.role === "ADMIN"` pattern is strictly forbidden.

### 9. Service API
The API strictly forbids client-provided actor identity overrides to prevent spoofing.
```typescript
async voidPayment(params: {
  paymentRecordId: string;
  idempotencyKey: string; // Provided by client as UUID
})
```
- The `actorId` (for idempotency ownership and audit event tracking) is obtained via `getServerSession()` internally inside the action/service layer.

### 10. Transaction Boundary
The entire execution is wrapped in a single, atomic Prisma transaction:
`prisma.$transaction(async (tx) => { ... }, { isolationLevel: 'ReadCommitted' })`

### 11. Lock Ordering
All financial mutations in RootGrain strictly acquire locks in this canonical order:
1. **IdempotencyKey**: Upsert (acquires row lock on the key).
2. **Order**: Acquired via `tx.$queryRaw<any[]>`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE``.
3. **PaymentRecord**: Modified via standard Prisma updates.

Concurrent operations (e.g., `recordPayment` and `voidPayment`, or future Price Revisions) strictly serialize by waiting on the single `Order` lock.

### 12. PaymentRecord Locking Decision
**Decision**: `PaymentRecord` itself does **not** need a separate `FOR UPDATE` lock.
**Justification**: `Order` acts as the Aggregate Root. By locking the `Order` before any reads or writes to its child `PaymentRecord`s, all concurrent financial operations are strictly serialized. Adding a separate lock on the child record introduces deadlock risk and provides zero additional safety.

### 13. Idempotency
We reuse the existing `IdempotencyKey` pattern.
- **Scope**: `void_payment`
- **OwnerType**: `USER`
- **Fingerprint**: `paymentRecordId` (A payment can only be successfully voided once; identical fingerprints across different keys will hit the "Already Voided" state validation).
- **Same key + same payload**: Deterministic replay of original success.
- **Different key + already voided**: Throws conflict (Already Voided).

### 14. Financial Formula
The financial authoritative formula strictly remains:
```typescript
newAdvancePaid = legacyAdvancePaid + SUM(COMPLETED payment amounts)
newBalanceDue = Order.total - newAdvancePaid
```

### 15. Order State Eligibility
There are **no** `OrderStatus` or `ProductionState` restrictions for payment voiding. A payment can be voided regardless of whether the order is `PENDING_ADVANCE`, `CANCELLED`, or `DELIVERED`, because voiding is an administrative correction of financial reality, which can happen at any time.

### 16. Audit Event
We preserve the existing `OrderEvent` conventions using a JSON payload.
- **eventType**: `PAYMENT_VOIDED`
- **actorId**: Trusted server identity.
- **payload**:
```json
{
  "paymentRecordId": "...",
  "amount": 1500,
  "method": "MANUAL_BKASH",
  "reference": "TRX123",
  "previousStatus": "COMPLETED",
  "newStatus": "VOIDED"
}
```

### 17. Gateway Boundary
RootGrain uses manual reconciliation (`MANUAL_BKASH`, `BANK_TRANSFER`, `COD`). There is no active payment gateway API configured.
**Boundary Decision**: Voiding is strictly a **local financial state mutation**. Do NOT attempt to wire external network calls (e.g., Stripe, bKash API). 

### 18. Admin UI
Located at `/admin/orders/[id]` in the Payment History section.
- **Visibility**: A "Void" button appears only on eligible (`COMPLETED` or `INITIATED`) payment rows.
- **Confirmation**: A standard destructive confirmation modal is required.
- **Client Input**: Submits only `paymentRecordId` and `idempotencyKey`. It does **not** submit amounts or actor IDs.
*(Note: Not implemented in this purely architectural slice).*

### 19. Database Impact
> [!WARNING]
> **SCHEMA CHANGE REQUIRED**
> The `PaymentStatus` enum must be updated to include `VOIDED`.
> No migration is required for `OrderEvent` because `eventType` is a `String`.

### 20. Test Matrix
**INITIATED:**
1. INITIATED → VOIDED succeeds.
2. INITIATED void causes ZERO financial change.

**COMPLETED:**
3. COMPLETED → VOIDED succeeds.
4. advancePaid decreases correctly.
5. balanceDue increases correctly.

**LOCKING:**
6. Concurrent payment record + void exactly serializes.
7. Concurrent void + void exactly serializes.
8. Concurrent future financial mutation + void exactly serializes.

**AUTH:**
9. Unauthenticated rejected (401).
10. USER role rejected (403).
11. Admin without `payment.void` rejected (403).
12. Admin with `payment.void` allowed.

**STATE:**
13. FAILED rejected.
14. REFUNDED rejected.
15. VOIDED rejected.

**IDEMPOTENCY:**
16. Same key replay returns identical success.
17. Same key conflicting payment returns error.
18. Different key already voided returns explicit conflict.

**SECURITY:**
19. Spoofed amount (impossible; not accepted by API).
20. Spoofed status (impossible; not accepted by API).
21. Spoofed orderId (impossible; derived server-side).
22. Spoofed actorId (impossible; derived from session).

**REGRESSION:**
23. Phase 7 interactions remain intact.
24. Phase 6 MTO interactions remain intact.
25. Payment recording remains intact.
26. Checkout remains intact.

### 21. Risks
- **Migration Risk**: Low. Appending a value to a Postgres enum (`ALTER TYPE "PaymentStatus" ADD VALUE 'VOIDED'`) is a safe, forward-only operation.

### 22. Acceptance Criteria
- [ ] `payment.void` RBAC enforcement is active without actor spoofing.
- [ ] Canonical lock ordering (`IdempotencyKey` -> `Order`) is strictly adhered to.
- [ ] `INITIATED` voids correctly without altering balances.
- [ ] `COMPLETED` voids correctly decrease `advancePaid` and increase `balanceDue`.
- [ ] `PAYMENT_VOIDED` event is appended.
- [ ] Full 26-point test matrix passes.

### 23. Explicit Out-of-Scope
- Implementing Stripe/bKash API void integration.
- Advance Revision.
- Price Revision.

### 24. Open Decisions
- *(None remaining. All ambiguities resolved).*
