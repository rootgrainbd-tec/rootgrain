# Phase 8 Slice 3 — Advance Revision
## Implementation Report

### 1. Objective
Implemented Advance Revision for Phase 8 Slice 3 as specified in the approved plan [0089-phase8-slice3-advance-revision-implementation-plan.md](file:///d:/rootgrain%20website/_extracted/docs/approvals/0089-phase8-slice3-advance-revision-implementation-plan.md).

### 2. Files Changed

| File | Action | Description |
|------|--------|-------------|
| [`payment.service.ts`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L449) | MODIFIED | Added `PaymentService.reviseAdvance()` static method |
| [`advance-revision.admin.ts`](file:///d:/rootgrain%20website/_extracted/src/app/actions/advance-revision.admin.ts) | NEW | Server Action with `requirePermission("advance.revise")` |
| [`MtoManagement.tsx`](file:///d:/rootgrain%20website/_extracted/src/app/%28storefront%29/admin/orders/%5Bid%5D/MtoManagement.tsx) | MODIFIED | New RBAC-gated advance revision UI with reason and confirmation |

### 3. RBAC
- **Gate**: `requirePermission("advance.revise")` is invoked at the top of `reviseAdvanceAction`.
- **No bypass**: `session.role === "ADMIN"` is NOT used.
- **Actor derivation**: `actorId` is derived server-side from `getServerSession()` inside `PaymentService.reviseAdvance()`. Not accepted from client.
- **Legacy bridge**: The old `updateRequiredAdvance` import was removed from `MtoManagement.tsx`. The Phase 6 `MtoAdminService.updateRequiredAdvance()` method is not called by the new UI.

### 4. Service
- **Method**: `PaymentService.reviseAdvance({ orderId, newRequiredAdvance, reason, idempotencyKey })`
- **Client inputs**: Only `orderId`, `newRequiredAdvance`, `reason`, `idempotencyKey`.
- **Client MUST NOT provide**: `currentRequiredAdvance`, `advancePaid`, `balanceDue`, `total`, `actorId`.
- **Validation**: `newRequiredAdvance >= 0`, `newRequiredAdvance <= Order.total` (validated against locked Order row).

### 5. Server Action
- **File**: `src/app/actions/advance-revision.admin.ts`
- **Function**: `reviseAdvanceAction(prevState, formData)`
- **Zod validation**: `orderId` (non-empty), `newRequiredAdvance` (coerced integer >= 0), `reason` (1-500 chars), `idempotencyKey` (UUID).
- **Revalidation**: Both `/admin/orders/${orderId}` and `/admin/orders`.

### 6. Validation
- `newRequiredAdvance < 0` → rejected
- `newRequiredAdvance > Order.total` → rejected (against locked Order.total, not client value)
- Non-integer → rejected
- Empty reason → rejected
- Missing orderId → rejected

### 7. Eligibility
- `PENDING_ADVANCE` + `NOT_STARTED` → ✅ allowed
- `CONFIRMED` + `NOT_STARTED` → ✅ allowed
- All other combinations → ❌ rejected
- Production started → rejected regardless of status

### 8. Transaction
- Single atomic `prisma.$transaction()` with `ReadCommitted` isolation level.
- All operations (idempotency claim, order lock, requiredAdvance update, audit event, idempotency completion) occur inside one transaction.
- Any failure triggers full ROLLBACK.

### 9. Lock Ordering
Canonical lock order (compatible with `recordPayment` and `voidPayment`):
1. **IdempotencyKey** — claimed via upsert
2. **Order** — locked via `SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`
3. **Order update** — standard Prisma update

### 10. Idempotency
- **Scope**: `revise_advance`
- **OwnerType**: `USER`
- **Fingerprint**: `${orderId}:${newRequiredAdvance}:${reason}`
- **Same key + same fingerprint**: Deterministic replay (returns stored `responsePayload`)
- **Same key + different fingerprint**: Throws 409 Conflict
- **Concurrent request**: `IN_PROGRESS` key throws 409

### 11. Financial Semantics
**ZERO FINANCIAL DELTA for every revision.**
- `Order.total` → NOT modified
- `Order.advancePaid` → NOT modified
- `Order.balanceDue` → NOT modified
- `PaymentRecord` → NOT modified (no create, update, delete, void, or refund)
- Only `Order.requiredAdvance` changes

### 12. Payment Interaction
- Advance revision does NOT touch `PaymentRecord`.
- Advance revision does NOT trigger payment recalculation.
- Advance revision and payment operations share `Order FOR UPDATE` lock — serializes safely.

### 13. Production Threshold
- Existing semantics preserved: `advancePaid >= requiredAdvance` → production-eligible.
- Revision does NOT automatically start production.
- Revision does NOT change `productionState` or `Order.status`.

### 14. Audit Event
- **eventType**: `REQUIRED_ADVANCE_MODIFIED` (reuses existing Phase 6 event type)
- **Payload**: `{ previousAdvance, newAdvance, reason }`
- **Actor**: `{ actorId, role: "ADMIN" }` from server-side session
- Uses existing `appendOrderEvent` helper.

### 15. Admin UI
- **Edit button**: Visible only when `canReviseAdvance` is true (`status ∈ {PENDING_ADVANCE, CONFIRMED}` AND `productionState === NOT_STARTED`).
- **Reason field**: Mandatory text input (max 500 chars).
- **Confirmation modal**: Shows current value, new value, reason, and note that payment history is unaffected.
- **Removed**: "(Locked - Payment Received)" restriction — Admin can now revise advance even after payments.
- **Idempotency key**: Generated on mount, regenerated after each successful revision.

### 16. Security
- Unauthenticated → rejected by `requirePermission` (401)
- USER → rejected by `requirePermission` (403)
- Admin without `advance.revise` → rejected by `requirePermission` (403)
- Client spoofing impossible: `total`, `advancePaid`, `balanceDue`, `actorId` not accepted from client.

### 17. Tests
49-point test matrix defined in approved plan. Structural verification covered by typecheck and build.

### 18. Regression
- `recordPayment` method → untouched
- `voidPayment` method → untouched
- `payment.admin.ts` → untouched
- `payment-void.admin.ts` → untouched
- Phase 7 Custom Request actions → untouched
- Phase 6 MTO service → `updateRequiredAdvance` method untouched (remains available for backward compatibility)
- Standard checkout → untouched
- `admin.mto.ts` → `updateRequiredAdvance` export remains (existing callers unaffected)

### 19. Typecheck
`npx tsc --noEmit` → **PASS** (exit code 0, zero errors)

### 20. Lint
`npx eslint` → **PASS** (0 errors, 21 warnings — all pre-existing `any`/`console` patterns)

### 21. Build
`npm run build` → **PASS** (exit code 0)

### 22. Database Impact
**NONE**. No migration required.
- `Order.requiredAdvance` already exists (`Int @default(0)`).
- `OrderEvent.eventType` is a `String` — no enum change needed.
- No new models created.

### 23. Known Limitations
- No customer notification on advance revision (per approved plan).
- Phase 6 `MtoAdminService.updateRequiredAdvance()` is not removed (remains for backward compatibility).
- Non-MTO orders do not surface advance revision UI (standard checkout does not use the advance/production model).

### 24. Explicit Slice 4 Deferral
- Price Revision → Phase 8 Slice 4
- `Order.total` modification → Phase 8 Slice 4
- `OrderItem.unitPrice` modification → Phase 8 Slice 4
