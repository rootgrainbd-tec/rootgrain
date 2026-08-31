# Phase 8 Slice 4 — Price Revision
## Final Implementation Plan R1

**Status**: READY FOR IMPLEMENTATION APPROVAL

### 1. Objective
Create the definitive technical design to implement Price Revision for Phase 8 Slice 4, allowing authorized Admin users to revise the `unitPrice` of eligible `OrderItem`s while strictly preserving financial invariants, payment history, advance threshold semantics, and idempotency, adhering entirely to the Business Decision Freeze in `0094` and Final Technical Decision Freeze.

### 2. Authoritative Documents
- `0094-phase8-slice4-business-decision-freeze.md` (Business Constraints)
- `0005R1-financial-model-payment-architecture-freeze.md` (Financial Integrity)
- `schema.prisma` (Database Structure)

### 3. Business Freeze Verification
- **Overpayment**: Rejected if `newTotal < advancePaid`.
- **Discount**: Immutable snapshot. No recalculation.
- **Required Advance**: Rejected if `newTotal < requiredAdvance`. No auto-reduction.
- **Eligibility**: `isMtoOrder = true` AND `productionState = NOT_STARTED` AND `status IN [PENDING_ADVANCE, CONFIRMED]` AND `advancePaid < total`.
- **Model**: `PriceRevision` is item-level (one record per `OrderItem`).
- **Invariants**: Payments, shipping, quantity, and product identity remain strictly immutable.

### 4. Adjustment Semantics
- `adjustment = newProductPrice - previousProductPrice`.
- It represents a signed price delta (e.g., 1000 → 1200 means `adjustment = +200`; 1200 → 900 means `adjustment = -300`).
- Absolute difference is explicitly NOT used.

### 5. Same-Value Behavior
- If `newUnitPrice === currentUnitPrice`, the request is **REJECTED**.
- Reason: No actual financial mutation occurred. A zero-value mutation must not create a `PriceRevision` or `PRICE_REVISED` event. A deterministic validation error is returned.

### 6. Actor Security Model (Trusted Actor Contract)
- The client MUST NOT provide `actorId`.
- The Server Action will:
  1. Authenticate the session.
  2. Enforce `requirePermission("price.revise")`.
  3. Resolve the trusted actor identity from the server session.
  4. Pass this trusted context internally to the service layer.
- Client-supplied `actorId` is strictly forbidden.

### 7. Final Service API
```typescript
interface PriceRevisionItemInput {
  orderItemId: string;
  newUnitPrice: number;
}

interface PriceRevisionInput {
  orderId: string;
  items: PriceRevisionItemInput[];
  reason: string;
  idempotencyKey: string;
}

async function reviseOrderPrice(
  input: PriceRevisionInput, 
  actor: TrustedActorContext
): Promise<Order>
```

### 8. Validation Rules
Before any mutation, ALL items are validated. If any item fails, the entire request rolls back:
1. Item exists.
2. Item belongs to the specified `orderId` (no foreign item injection).
3. `newUnitPrice >= 0`.
4. `newUnitPrice !== currentUnitPrice` (Reject same-value).
5. No duplicate `orderItemId` in the request.

### 9. Transaction Model
One atomic Prisma `$transaction`. If any item validation, calculation, or constraint check fails, the entire transaction rolls back. All multi-item revisions succeed atomically or fail entirely.

### 10. Lock Ordering
Canonical lock sequence:
1. **IdempotencyKey**: Upsert (locks idempotency context).
2. **Order**: `SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`.
3. **OrderItem**: Affected `OrderItem`s will be ordered deterministically by ascending `OrderItem.id` before acquiring locks or mutating.

### 11. Idempotency
- **Fingerprint Scope**: Canonical deterministic JSON string: `orderId` + sorted array of `{id, price}` + `reason`.
- **Conflict**: Same key + different fingerprint throws 409.
- **Replay**: Same key + same fingerprint returns the existing response.
- `actorId` is not included in the client-controlled fingerprint unless required by existing infrastructure.

### 12. PriceRevision Schema & Audit Retention Strategy
Database Additions:
```prisma
model PriceRevision {
  id                   String   @id @default(cuid())
  orderId              String
  orderItemId          String
  previousProductPrice Int
  adjustment           Int
  newProductPrice      Int
  reason               String
  actor                Json
  createdAt            DateTime @default(now())

  order                Order    @relation(fields: [orderId], references: [id], onDelete: Restrict)
  orderItem            OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Restrict)

  @@index([orderId])
  @@index([orderItemId])
}
```
**Audit Retention Strategy**: An inspection of `schema.prisma` reveals that `PaymentRecord`, `OrderEvent`, and `OrderItem` do not use `onDelete: Cascade` (they rely on Prisma's default `Restrict` or explicitly declare `Restrict`). Thus, `Order` records are effectively protected from hard-deletion by existing financial history. `PriceRevision` will adopt `onDelete: Restrict` to perfectly match the existing financial audit retention policy.

### 13. Event Strategy
- Create exactly **ONE** canonical `OrderEvent` of type `PRICE_REVISED` per successful Admin operation.
- The event represents the entire atomic revision and must preserve: actor, orderId, reason, all changed item IDs, previous prices, new prices, previous total, new total, and timestamp.
- Do NOT create one event per item.

### 14. Financial Calculation
For each affected item:
1. `newItemTotal = newUnitPrice × existing quantity`
Then:
2. `newSubtotal = SUM(all OrderItem totals)`
3. `newTotal = newSubtotal + existing shippingCost - existing discountAmount`
4. `newBalanceDue = newTotal - existing advancePaid`
Verify:
5. `newTotal >= advancePaid`
6. `newTotal >= requiredAdvance`
7. `newBalanceDue >= 0`

### 15. Boundaries
- **Payment**: Never modify `PaymentRecord` amounts/status. Never create, void, refund, or delete payments.
- **Advance**: `requiredAdvance` and `advancePaid` remain strictly unchanged.
- **Discount/Shipping**: `discountAmount`, `promoCode`, and `shippingCost` remain unchanged.
- **Quantity/Product**: `OrderItem.quantity` and `productId` remain unchanged.

### 16. Test Matrix
**ADJUSTMENT:**
1. increase → positive delta
2. decrease → negative delta
3. same-value → rejected
**ACTOR:**
4. client cannot supply actorId
5. actor comes from trusted session
**MULTI-ITEM:**
6. two items succeed atomically
7. one invalid item rolls back all
**EVENT:**
8. one PRICE_REVISED event per operation
9. event contains all changed items
**AUDIT:**
10. PriceRevision per changed item
11. previous price correct
12. new price correct
13. signed adjustment correct
**SECURITY:**
14. spoofed actorId ignored/rejected
15. spoofed total ignored
16. spoofed balance ignored
**REGRESSION:**
17. Slice 1
18. Slice 2
19. Slice 3
20. Phase 7
21. Phase 6

### 17. Remaining Blockers
- None.

---

**STATUS: READY FOR IMPLEMENTATION APPROVAL**
