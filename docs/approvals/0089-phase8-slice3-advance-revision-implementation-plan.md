# Phase 8 Slice 3 — Advance Revision
## Detailed Implementation Plan

### 1. Objective
Enable an authorized Admin with `advance.revise` permission to safely revise the `requiredAdvance` amount on an Order. The revision modifies only the commercial obligation threshold — it does NOT modify `Order.total`, `advancePaid`, `balanceDue`, or any `PaymentRecord`. Financial recalculation is not triggered because `requiredAdvance` is not a variable in the `balanceDue` formula.

### 2. Authoritative Sources
- **`0005R1-financial-model-payment-architecture-freeze.md`**: Establishes `requiredAdvance` as a negotiated advance amount, editable by Admin. Establishes `balanceDue = total - advancePaid`.
- **`0080-phase8-slice-architecture-approval.md`**: Defines Slice 3 scope: "Revise required advance service, blocking revisions after production starts."
- **`0082-phase8-slice1-rbac-implementation-plan-r1.md`**: Provides `advance.revise` permission.
- **`0086-phase8-slice2-payment-voiding-implementation-plan-r1.md`**: Establishes canonical lock ordering.
- **`src/services/mto-admin.service.ts` → `updateRequiredAdvance()`**: Existing Phase 6 implementation (MTO-only, zero-payment-only).

### 3. Repository Audit

#### 3.1 Existing `updateRequiredAdvance` (Phase 6 Legacy)
Located in [`mto-admin.service.ts:99-137`](file:///d:/rootgrain%20website/_extracted/src/services/mto-admin.service.ts#L99-L137):
- **Restricted to**: MTO orders only (`order.isMtoOrder` check).
- **Restricted to**: Zero COMPLETED payments (`paymentCount > 0` → rejected).
- **Resets deadline**: Sets `advanceDeadline = now + 48h`.
- **No idempotency**: No `IdempotencyKey` integration.
- **No RBAC**: Uses legacy `requireAdmin()` bridge (`session.role === "ADMIN"`).
- **Lock**: Acquires `Order FOR UPDATE`.
- **Event**: `REQUIRED_ADVANCE_MODIFIED`.

#### 3.2 How `requiredAdvance` Is Set
| Origin | Value | Context |
|--------|-------|---------|
| Standard checkout | `0` (schema default) | Non-MTO orders |
| MTO checkout | `Math.floor(total * 0.5)` | MTO orders |
| Custom Request quote | Admin-specified value | Custom order conversion |
| `updateRequiredAdvance` | Admin-specified value | MTO admin action (Phase 6) |

#### 3.3 How `requiredAdvance` Is Used
| Consumer | Usage |
|----------|-------|
| `startMtoProduction()` | Gate: `authoritativePaid >= requiredAdvance` |
| MTO Admin UI | Display + edit (Phase 6) |
| Invoice snapshot | Stored in document snapshot |
| Admin OrdersTable | Display column |
| Custom Request QuotePrepClient | Quote preparation form |
| "Start Production" button visibility | `advancePaid >= requiredAdvance` |

### 4. Financial Architecture

#### 4.1 Core Fields
| Field | Meaning | Mutability |
|-------|---------|------------|
| `Order.total` | Grand total price of the order | Immutable (per 0005R1 §14, until Slice 4 Price Revision) |
| `Order.requiredAdvance` | Negotiated advance the customer must pay before production | **Mutable** (Admin-editable, per 0005R1 §3) |
| `Order.advancePaid` | Cached total of all COMPLETED payments | Derived: `legacyAdvancePaid + SUM(COMPLETED payments)` |
| `Order.balanceDue` | Remaining amount owed | Derived: `total - advancePaid` |
| `Order.legacyAdvancePaid` | Pre-upgrade payment amount (frozen) | Immutable |

#### 4.2 Critical Financial Distinction
`requiredAdvance` is a **threshold/policy** field. It determines *how much the customer should pay before production can start*. It is NOT a variable in the `balanceDue` formula.

The authoritative `balanceDue` formula is:
```
balanceDue = total - advancePaid
```

`requiredAdvance` does NOT appear in this formula. Therefore, changing `requiredAdvance` does NOT change `advancePaid`, `balanceDue`, or `total`.

### 5. RequiredAdvance Semantics
- `requiredAdvance` is the Admin-negotiated minimum advance payment.
- It is a commercial obligation threshold, not a financial accounting field.
- It governs production eligibility: `advancePaid >= requiredAdvance` → eligible for production.
- It does NOT contribute to the `balanceDue` calculation.
- Changing it does NOT void, create, or modify payments.

### 6. AdvancePaid Semantics
- `advancePaid` is a cached aggregate of actual payments received.
- Formula: `legacyAdvancePaid + SUM(COMPLETED PaymentRecord amounts)`
- It is modified ONLY by payment mutations (`recordPayment`, `voidPayment`).
- Advance revision does NOT modify `advancePaid`.

### 7. BalanceDue Semantics
- `balanceDue` = `total - advancePaid`
- It reflects how much the customer still owes in total.
- It is modified ONLY by payment mutations or price revision (Slice 4).
- Advance revision does NOT modify `balanceDue`.

### 8. Revision Scenarios

| # | Scenario | Allowed | Financial Impact | Notes |
|---|----------|---------|-----------------|-------|
| A | Increase advance (e.g., 30K → 50K) | ✅ Yes | ZERO | Customer must pay more before production can start |
| B | Decrease advance (e.g., 50K → 20K) | ✅ Yes | ZERO | Customer needs less before production starts |
| C | Same-value revision (50K → 50K) | ✅ Yes (idempotent no-op behavior) | ZERO | Accepted but functionally no change |
| D | Advance = 0 | ✅ Yes | ZERO | Effectively waives advance requirement |
| E | Advance = Order.total | ✅ Yes | ZERO | Full prepayment required before production |
| F | New advance < advancePaid | ✅ Yes | ZERO | Customer has already exceeded the new requirement; production-eligible |
| G | New advance = advancePaid | ✅ Yes | ZERO | Customer has met the exact new requirement |
| H | New advance > advancePaid | ✅ Yes | ZERO | Customer still needs to pay more before production |
| I | Repeated revision | ✅ Yes | ZERO | Each revision is independently audited |
| J | Concurrent revision | ✅ Serialized | ZERO | FOR UPDATE lock ensures one-at-a-time |

### 9. Invariants

| Invariant | Enforced | Justification |
|-----------|----------|---------------|
| `requiredAdvance >= 0` | ✅ YES | Negative advance is meaningless |
| `requiredAdvance <= total` | ✅ YES | Cannot require more than the order costs |
| `requiredAdvance >= advancePaid` | ❌ NO | Admin may lower the threshold below what's already paid. This is a valid business scenario (e.g., customer overpaid, Admin reduces requirement retroactively). The `startProduction` gate still works correctly because `advancePaid >= requiredAdvance` remains true. |

### 10. Payment-Void Interaction
Advance revision and payment voiding are **independent financial mutations**.
- Advance revision changes `requiredAdvance` only.
- Payment voiding changes `advancePaid` and `balanceDue`.
- They share the same `Order FOR UPDATE` lock, so concurrent execution serializes safely.
- Neither operation modifies the other's domain fields.

Example:
```
requiredAdvance = 50,000
advancePaid = 30,000

Admin revises requiredAdvance to 20,000.
Result: requiredAdvance = 20,000, advancePaid = 30,000 (unchanged), balanceDue unchanged.
Customer is now production-eligible (30,000 >= 20,000).
```

### 11. RBAC
- **Gate**: `requirePermission("advance.revise")`
- **No bypass**: `session.role === "ADMIN"` is NOT used.
- **Actor derivation**: Server-side from `getServerSession()`.
- **Client MUST NOT provide**: `actorId`.

### 12. Service API
```typescript
static async reviseAdvance(params: {
  orderId: string;
  newRequiredAdvance: number;
  reason: string;
  idempotencyKey: string;
})
```
- `orderId`: Identifies the target order.
- `newRequiredAdvance`: The new advance amount (integer, >= 0, <= total).
- `reason`: Mandatory. Explains the business reason for the revision.
- `idempotencyKey`: UUID for idempotent replay.

**Client MUST NOT provide**: `currentRequiredAdvance`, `advancePaid`, `balanceDue`, `total`, `actorId`.

### 13. Transaction
Wrapped in `prisma.$transaction(async (tx) => { ... }, { isolationLevel: 'ReadCommitted' })`.

### 14. Lock Ordering
Canonical lock order (compatible with `recordPayment`, `voidPayment`, and future `revisePrice`):
1. **IdempotencyKey** — claimed via upsert
2. **Order** — locked via `SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`
3. **Order update** — standard Prisma update

No PaymentRecord locks needed (advance revision does not touch payments).

### 15. Concurrency
- **Revision + Revision**: Serialized by `Order FOR UPDATE`. Second revision reads the latest state after acquiring lock.
- **Revision + Payment Record**: Serialized by `Order FOR UPDATE`. Payment recording and advance revision cannot race.
- **Revision + Payment Void**: Serialized by `Order FOR UPDATE`. Both operate on the same aggregate root.
- No lost updates, no stale reads, no negative values.

### 16. Idempotency
- **Scope**: `revise_advance`
- **OwnerType**: `USER`
- **Fingerprint**: `${orderId}:${newRequiredAdvance}:${reason}`
- **Same key + same fingerprint**: Deterministic replay of original success.
- **Same key + different fingerprint**: Throws 409 Conflict.
- **Different key + new amount**: Applies new revision (multiple revisions allowed).

### 17. Audit Event
- **eventType**: `REQUIRED_ADVANCE_MODIFIED` (reuse existing event name from Phase 6 `mto-admin.service.ts:134`)
- **Payload**:
```json
{
  "previousAdvance": 50000,
  "newAdvance": 30000,
  "reason": "Customer negotiated lower advance"
}
```
- **Actor**: `{ actorId, role: "ADMIN" }` — server-derived.
- Uses existing `appendOrderEvent` helper.

### 18. Revision History Strategy
**Decision**: `OrderEvent` alone is sufficient. No dedicated `AdvanceRevision` model is needed.

**Justification**:
1. The existing Phase 6 implementation already uses `REQUIRED_ADVANCE_MODIFIED` events for audit trail.
2. Each event preserves `previousAdvance`, `newAdvance`, and `reason`.
3. Full revision history is queryable by filtering `OrderEvent` where `eventType = 'REQUIRED_ADVANCE_MODIFIED'`.
4. A dedicated model would add schema complexity with zero incremental value for this use case.

### 19. Order Eligibility
**Eligible states** (advance revision allowed):

| OrderStatus | ProductionState | Eligible | Reason |
|-------------|----------------|----------|--------|
| `PENDING_ADVANCE` | `NOT_STARTED` | ✅ | Pre-payment phase |
| `CONFIRMED` | `NOT_STARTED` | ✅ | Confirmed but production not yet started |

**Ineligible states** (advance revision rejected):

| OrderStatus | ProductionState | Eligible | Reason |
|-------------|----------------|----------|--------|
| `PROCESSING` | `IN_PROGRESS` | ❌ | Production already started |
| `PROCESSING` | `COMPLETE` | ❌ | Production complete |
| `DISPATCHED` | any | ❌ | Order shipped |
| `DELIVERED` | any | ❌ | Order delivered |
| `CANCELLED` | any | ❌ | Order cancelled |
| `REJECTED` | any | ❌ | Order rejected |

**Rule**: Advance revision is permitted ONLY when `status ∈ {PENDING_ADVANCE, CONFIRMED}` AND `productionState === NOT_STARTED`.

This aligns with 0080 §7: "blocking revisions after production starts."

> [!IMPORTANT]
> **Difference from Phase 6 legacy**: The Phase 6 `updateRequiredAdvance` blocks revision when ANY completed payment exists. The Phase 8 Slice 3 version removes this restriction — Admin can revise advance even after payments are received. This is the correct business behavior because `requiredAdvance` is a threshold, not a financial accounting field. Lowering it after partial payment simply changes the production eligibility gate.

### 20. Admin UI
- **Location**: The existing `MtoManagement.tsx` component already contains an advance editing interface.
- **Current behavior**: Edit button → inline input → `updateRequiredAdvance` action (Phase 6, MTO-only, no RBAC).
- **Phase 8 changes**:
  - Replace `updateRequiredAdvance` call with new `reviseAdvanceAction` using `requirePermission("advance.revise")`.
  - Add mandatory `reason` text input field.
  - Add `idempotencyKey` generation.
  - Remove the "Locked - Payment Received" restriction from the UI (server still enforces production-started restriction).
  - Confirmation dialog before submission.
  - Display revision history from `OrderEvent` entries.

> [!IMPORTANT]
> For non-MTO standard orders, `requiredAdvance` defaults to `0` and advance revision is not surfaced in the UI (standard checkout does not use the advance/production model). The PaymentLedger page does not show advance revision controls.

### 21. Customer Impact
- **No customer-facing changes**: `requiredAdvance` is not displayed on the customer tracking page.
- The checkout invoice page reads `requiredAdvance` from a snapshot (document snapshot, not live Order), so revisions do NOT retroactively alter issued invoices.
- No customer notification on advance revision (administrative internal action).

### 22. Payment Boundary
Advance revision MUST NOT:
- Void, refund, or create payments
- Modify `PaymentRecord.amount` or `PaymentRecord.status`
- Modify `Order.advancePaid`
- Modify `Order.balanceDue`
- Delete or rewrite payment history

### 23. Price Boundary
Advance revision MUST NOT:
- Modify `Order.total`
- Modify `OrderItem.unitPrice` or `OrderItem.total`
- Modify product prices

Price Revision belongs to Slice 4.

### 24. Database Impact
**No schema migration required.**
- `Order.requiredAdvance` already exists (`Int @default(0)`).
- `OrderEvent.eventType` is a `String` — `REQUIRED_ADVANCE_MODIFIED` requires no enum change.
- No new models needed (revision history stored in `OrderEvent`).

### 25. Test Matrix

**AUTH:**
1. Unauthenticated → rejected (401)
2. USER → rejected (403)
3. Admin without `advance.revise` → rejected (403)
4. Admin with `advance.revise` → allowed

**VALIDATION:**
5. Negative advance → rejected
6. Advance > total → rejected
7. Invalid numeric input → rejected
8. Empty reason → rejected
9. Same-value revision → accepted (no-op audit event)

**REVISION:**
10. Increase advance succeeds
11. Decrease advance succeeds
12. Advance = 0 succeeds
13. Advance = total succeeds
14. New advance < advancePaid succeeds (zero financial change)
15. New advance = advancePaid succeeds
16. New advance > advancePaid succeeds

**FINANCE:**
17. `Order.total` unchanged after revision
18. `Order.advancePaid` unchanged after revision
19. `Order.balanceDue` unchanged after revision
20. Payment history unchanged after revision
21. No negative values

**HISTORY:**
22. `REQUIRED_ADVANCE_MODIFIED` event created
23. `previousAdvance` preserved in event payload
24. `newAdvance` preserved in event payload
25. `reason` preserved in event payload

**IDEMPOTENCY:**
26. Same key replay returns deterministic success
27. Same key conflicting payload returns 409
28. Different key concurrent revisions serialize correctly

**CONCURRENCY:**
29. Revision + revision serializes (no lost update)
30. Revision + payment record serializes
31. Revision + payment void serializes

**SECURITY:**
32. Spoofed amount has no effect (validated server-side)
33. Spoofed advancePaid impossible (not accepted)
34. Spoofed balanceDue impossible (not accepted)
35. Spoofed total impossible (not accepted)
36. Spoofed actorId impossible (derived from session)

**ORDER ELIGIBILITY:**
37. `PENDING_ADVANCE` + `NOT_STARTED` → allowed
38. `CONFIRMED` + `NOT_STARTED` → allowed
39. `PROCESSING` → rejected
40. `DISPATCHED` → rejected
41. `DELIVERED` → rejected
42. `CANCELLED` → rejected
43. `REJECTED` → rejected

**REGRESSION:**
44. Phase 7 Custom Request intact
45. Slice 1 RBAC intact
46. Slice 2 payment void intact
47. Phase 6 MTO intact
48. Standard checkout intact

### 26. Risks
- **Low risk**: No schema migration. No financial formula changes.
- **Behavioral change from Phase 6**: Removing the "zero payments" restriction. This is intentional per business requirements but must be tested carefully.

### 27. Acceptance Criteria
- [ ] `advance.revise` RBAC enforcement is active
- [ ] Production-started orders are rejected
- [ ] `requiredAdvance` updates correctly
- [ ] `advancePaid`, `balanceDue`, `total` are all unchanged
- [ ] `REQUIRED_ADVANCE_MODIFIED` event is appended with previous/new/reason
- [ ] Reason is mandatory
- [ ] Idempotency works correctly
- [ ] Concurrent operations serialize through Order lock
- [ ] 48-point test matrix passes

### 28. Explicit Out-of-Scope
- Price Revision (Slice 4)
- Payment voiding (Slice 2 — complete)
- External gateway APIs
- Customer notifications on advance revision
- Non-MTO order advance revision UI

### 29. Open Decisions
- *(None remaining. All ambiguities resolved by repository audit).*
