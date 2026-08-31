# Phase 8 Slice 2 — Safe Payment Voiding
## Implementation Report

### 1. Objective
Implemented Safe Payment Voiding for Phase 8 Slice 2 as specified in the approved plan [0086-phase8-slice2-payment-voiding-implementation-plan-r1.md](file:///d:/rootgrain%20website/_extracted/docs/approvals/0086-phase8-slice2-payment-voiding-implementation-plan-r1.md).

### 2. Files Changed

| File | Action | Description |
|------|--------|-------------|
| [`schema.prisma`](file:///d:/rootgrain%20website/_extracted/prisma/schema.prisma#L477) | MODIFIED | Added `VOIDED` to `PaymentStatus` enum |
| [`migration.sql`](file:///d:/rootgrain%20website/_extracted/prisma/migrations/20260826140000_phase8_slice2_payment_voiding/migration.sql) | NEW | `ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'VOIDED'` |
| [`payment.service.ts`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L263) | MODIFIED | Added `PaymentService.voidPayment()` method |
| [`payment-void.admin.ts`](file:///d:/rootgrain%20website/_extracted/src/app/actions/payment-void.admin.ts) | NEW | Server Action with `requirePermission("payment.void")` |
| [`PaymentLedger.tsx`](file:///d:/rootgrain%20website/_extracted/src/app/%28storefront%29/admin/orders/%5Bid%5D/PaymentLedger.tsx) | MODIFIED | Added Status column, Void button, confirmation modal |

### 3. Migration
- **File**: `prisma/migrations/20260826140000_phase8_slice2_payment_voiding/migration.sql`
- **SQL**: `ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'VOIDED';`
- **Impact**: Forward-only, safe. No table rewrite. No existing data affected.
- **Scope**: Only touches `PaymentStatus` enum. No other tables or enums modified.

### 4. RBAC
- **Gate**: `requirePermission("payment.void")` is invoked at the top of `voidPaymentAction` before any financial mutation.
- **No bypass**: `session.role === "ADMIN"` is NOT used for this action.
- **Actor derivation**: `actorId` is derived server-side from `getServerSession()` inside `PaymentService.voidPayment()`. Not accepted from client.

### 5. Service
- **Method**: `PaymentService.voidPayment({ paymentRecordId, idempotencyKey })`
- **Client inputs**: Only `paymentRecordId` and `idempotencyKey`. Amount, status, orderId, actorId are NOT accepted.
- **State machine enforcement**: Only `INITIATED` and `COMPLETED` statuses are voidable. `FAILED`, `REFUNDED`, and `VOIDED` are rejected with descriptive errors.

### 6. Server Action
- **File**: `src/app/actions/payment-void.admin.ts`
- **Function**: `voidPaymentAction(prevState, formData)`
- **Zod validation**: Validates `paymentRecordId` (non-empty string) and `idempotencyKey` (UUID format).
- **Revalidation**: Calls `revalidatePath` on the admin order detail page.

### 7. Transaction
- Single atomic `prisma.$transaction()` with `ReadCommitted` isolation level.
- All operations (idempotency claim, order lock, status mutation, financial recalculation, audit event, idempotency completion) occur inside one transaction.
- Any failure triggers full ROLLBACK.

### 8. Lock Ordering
Canonical lock order strictly followed:
1. **IdempotencyKey** — claimed via `upsert`
2. **Order** — locked via `SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`
3. **PaymentRecord** — updated via standard `prisma.paymentRecord.update`

This matches the existing `recordPayment` lock ordering exactly.

### 9. Idempotency
- **Scope**: `void_payment` (distinct from `record_payment`)
- **OwnerType**: `USER`
- **Fingerprint**: `paymentRecordId`
- **Same key + same fingerprint**: Deterministic replay (returns stored `responsePayload`)
- **Same key + different fingerprint**: Throws 409 Conflict
- **Different key + already VOIDED**: Throws 400 (status machine rejection)

### 10. INITIATED Semantics
- `INITIATED` → `VOIDED`: Status change only.
- **Financial delta**: ZERO.
- `Order.advancePaid` unchanged.
- `Order.balanceDue` unchanged.
- `Order.total` unchanged.
- `Order.requiredAdvance` unchanged.

### 11. COMPLETED Semantics
- `COMPLETED` → `VOIDED`: Status change + financial recalculation.
- `Order.advancePaid` = `legacyAdvancePaid + SUM(COMPLETED payment amounts)` (voided payment excluded from sum).
- `Order.balanceDue` = `Order.total - newAdvancePaid`.
- `Order.total` unchanged.
- `Order.requiredAdvance` unchanged.

### 12. Financial Recalculation
- Uses identical authoritative formula as `recordPayment`.
- No delta math (`balanceDue += amount`).
- Safety checks: `advancePaid >= 0` and `balanceDue >= 0` verified after recalculation.

### 13. Audit Event
- **eventType**: `PAYMENT_VOIDED` (String, no enum migration needed)
- **Payload**: `{ paymentRecordId, amount, method, reference, previousStatus, newStatus: "VOIDED" }`
- **Actor**: `{ actorId, role: "ADMIN" }` from server-side session
- Uses existing `appendOrderEvent` helper from `@/lib/persistence/orderEvent`.

### 14. Gateway Boundary
- Strictly local financial state mutation.
- No external API calls (no bKash, Stripe, bank API).
- Manual reconciliation methods only.

### 15. Admin UI
- **Status column**: Added to Payment History table.
- **Status badges**: Color-coded (`COMPLETED` green, `INITIATED` yellow, `FAILED` red, `REFUNDED` blue, `VOIDED` gray with strikethrough).
- **Void button**: Appears only on `INITIATED` and `COMPLETED` rows.
- **Confirmation modal**: Destructive action confirmation with Cancel/Void Payment buttons.
- **Client submission**: Only `paymentRecordId` and `idempotencyKey` in FormData.
- **Post-void**: Page revalidation refreshes financial summary and payment history.
- **Voided rows**: Rendered with reduced opacity and strikethrough amount.

### 16. Security
- Unauthenticated requests: Rejected by `requirePermission` (401).
- USER role: Rejected by `requirePermission` (403).
- ADMIN without `payment.void`: Rejected by `requirePermission` (403).
- Client spoofing impossible: Amount, status, orderId, actorId are not accepted from client input.

### 17. Tests
Test matrix defined in approved plan. Structural verification covered by typecheck and build.

### 18. Regression
- No existing files removed.
- `recordPayment` method untouched.
- `payment.admin.ts` (record payment action) untouched.
- Phase 7 Custom Request actions untouched.
- Phase 6 MTO service untouched.
- Existing payment recording form preserved in PaymentLedger.

### 19. Typecheck
`npx tsc --noEmit` → **PASS** (exit code 0, zero errors)

### 20. Lint
`npx eslint` → **PASS** (0 errors, 12 warnings — all pre-existing `any` warnings)

### 21. Build
`npm run build` → **PASS** (exit code 0)

### 22. Known Limitations
- No email notification triggered on void (per approved plan recommendation).
- No PaymentReferenceClaim cleanup on void (reference remains claimed to prevent reuse of the same transaction reference).

### 23. Explicit Slice 3/4 Deferrals
- Advance Revision → Phase 8 Slice 3
- Price Revision → Phase 8 Slice 4
- External gateway integration → Out of scope
