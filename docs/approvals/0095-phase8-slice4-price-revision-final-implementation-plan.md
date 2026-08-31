# Phase 8 Slice 4 — Price Revision
## Final Implementation Plan

**Status**: READY FOR APPROVAL

### 1. Objective
Create the definitive technical design to implement Price Revision for Phase 8 Slice 4, allowing authorized Admin users to revise the `unitPrice` of eligible `OrderItem`s while strictly preserving financial invariants, payment history, advance threshold semantics, and idempotency, adhering entirely to the Business Decision Freeze in `0094`.

### 2. Authoritative Documents
- `0094-phase8-slice4-business-decision-freeze.md` (Business Constraints)
- `0005R1-financial-model-payment-architecture-freeze.md` (Financial Integrity)
- `schema.prisma` (Database Structure)
- `payment.service.ts` (Existing lock & idempotency patterns)

### 3. Business Freeze Verification
This implementation plan strictly obeys `0094`:
- **Overpayment**: Rejected if `newTotal < advancePaid`.
- **Discount**: Immutable snapshot. No recalculation.
- **Required Advance**: Rejected if `newTotal < requiredAdvance`. No auto-reduction.
- **Eligibility**: `isMtoOrder = true` AND `productionState = NOT_STARTED` AND `status IN [PENDING_ADVANCE, CONFIRMED]` AND `advancePaid < total`.
- **Model**: `PriceRevision` is item-level (one record per `OrderItem`).
- **Invariants**: Payments, shipping, quantity, and product identity remain strictly immutable.

### 4. Current Repository Architecture
- **Pricing Truth**: `OrderItem.unitPrice` and `OrderItem.quantity` dictate `OrderItem.total`.
- **Locking Pattern**: Existing services (e.g., `payment.service.ts`) lock in the order: `IdempotencyKey` → `Order FOR UPDATE`.
- **Eventing**: Canonical `OrderEvent` is used for operational history.

### 5. Price Source of Truth
- **Item Level**: `OrderItem.unitPrice` (Int).
- **Subtotal**: The sum of all `OrderItem.total` values.
- **Total**: Computed using the snapshots (`subtotal + shippingCost - discountAmount`).
- **Balance Due**: Derived dynamically (`total - advancePaid`).

### 6. Mutation Scope
**Allowed Modifications:**
- `OrderItem.unitPrice`
- `OrderItem.total`
- `Order.subtotal`
- `Order.total`
- `Order.balanceDue`

### 7. Eligibility Matrix
Enforced Server-Side:
- `isMtoOrder = true`
- `productionState = NOT_STARTED`
- `status IN [PENDING_ADVANCE, CONFIRMED]`
- `advancePaid < Order.total` (Not fully paid)

### 8. Payment Boundary
- `PaymentRecord` history is completely immutable. No records are created, voided, refunded, or modified.
- `advancePaid` caching remains untouched.

### 9. Advance Boundary
- `requiredAdvance` remains untouched.
- If calculated `newTotal < requiredAdvance`, the entire revision request is **REJECTED**.
- An explicit Advance Revision (Slice 3) must be performed by the admin beforehand if they wish to lower the required advance.

### 10. Discount Boundary
- `Order.discountAmount` and `Order.promoCode` remain **UNCHANGED**. Percentage formulas will NOT be retroactively recalculated.

### 11. Shipping Boundary
- `Order.shippingCost` remains **UNCHANGED**.

### 12. OrderItem Boundary
- `OrderItem.quantity` and `OrderItem.productId` remain **UNCHANGED**.
- New items cannot be created, and existing items cannot be deleted via this endpoint.

### 13. Service API
The exact shape of the Server Action / Service API:
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

async function reviseOrderPrice(input: PriceRevisionInput, actorId: string): Promise<Order>
```
*Note: Client provides ONLY the desired `newUnitPrice` per item. Derived totals are rejected.*

### 14. Validation
For every requested item:
- Validate `newUnitPrice >= 0`.
- Verify the item belongs to the specified `orderId`.
- Prevent duplicate `orderItemId`s in the request array.

### 15. RBAC
- Explicit check: `requirePermission("price.revise")` must pass before transaction execution.
- Strict rejection of `session.role === "ADMIN"` bypasses.

### 16. Transaction Model
One atomic Prisma `$transaction`. If any item validation or constraint check fails, the entire transaction rolls back.

### 17. Lock Ordering
Canonical lock sequence (verified with `payment.service.ts`):
1. **IdempotencyKey**: Upsert (locks idempotency context).
2. **Order**: `SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`.
3. **OrderItem**: To prevent deadlocks when updating multiple items concurrently, affected `OrderItem`s will be ordered by `OrderItem.id` ascending, then updated.

### 18. Idempotency
- **Fingerprint Scope**: Canonical deterministic JSON string: `orderId` + sorted array of `{id, price}` + `reason`.
- **Conflict**: Same key + different fingerprint throws 409.
- **Replay**: Same key + same fingerprint returns the existing `IdempotencyKey.responsePayload` if `COMPLETED`.

### 19. PriceRevision Model
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

  order                Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderItem            OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([orderItemId])
}
```

### 20. Audit Event
- **Granular**: One `PriceRevision` record per changed `OrderItem`.
- **Canonical Event**: A single `OrderEvent` of type `PRICE_REVISED` will be generated summarizing all changed items (actor, reason, previous and new totals).

### 21. Financial Recalculation (Server-Side)
Inside the transaction (after lock):
1. `newItemTotal = newUnitPrice * existingQuantity`.
2. Update all requested `OrderItem`s.
3. Calculate `newSubtotal` by summing all `OrderItem.total` (including unrevised items in the order).
4. Calculate `newTotal = newSubtotal + existingShippingCost - existingDiscountAmount`.
5. Verify `newTotal >= advancePaid` and `newTotal >= requiredAdvance`.
6. Calculate `newBalanceDue = newTotal - advancePaid`.
7. Commit `Order` updates.

### 22. Admin UI
- Integration point: `/admin/orders/[id]/MtoManagement.tsx`.
- UI will allow editing unit prices.
- Will display calculated preview of `subtotal`, `total`, and `balanceDue`.
- Will prevent submission if `newTotal < requiredAdvance` or `newTotal < advancePaid` (client-side gating, but server is ultimate authority).

### 23. Customer Impact
- No new workflows. Customer views the updated financial state transparently via the standard order status page. No automatic SMS/Email dispatch introduced.

### 24. Database Impact
- Creation of `PriceRevision` table.
- Indexing on `orderId` and `orderItemId`.

### 25. Migration Plan
- Additive schema change only.
- Fully backwards-compatible. Existing orders and payment events remain untouched.

### 26. Test Matrix
61 exact test cases documented in the prompt will be executed, covering AUTH, ELIGIBILITY, VALIDATION, PRICE, FINANCIAL, OVERPAYMENT, ADVANCE, PAYMENT, IDEMPOTENCY, CONCURRENCY, AUDIT, SECURITY, and REGRESSION.

### 27. Security
- Client input is completely untrusted for derived financial sums.
- Strict `price.revise` permission check.

### 28. Performance
- Single `$transaction`. 
- Indexed foreign keys in `PriceRevision`.

### 29. Risks
- Concurrent modifications from Admin payments. Mitigated by `FOR UPDATE` lock on `Order`.

### 30. Acceptance Criteria
- Admin can revise unit prices.
- Valid multi-item revisions succeed atomically.
- Invariants (Advance, Overpayment) correctly reject invalid states.
- Idempotency prevents double execution.

### 31. Open Decisions
- **Adjustment Semantics**: Does `adjustment = newProductPrice - previousProductPrice`? [OPEN DECISION - No explicit repository evidence found to confirm this exact formula vs absolute difference vs delta payload].
- **Same-Value Revision**: Does a revision requesting `newUnitPrice == currentUnitPrice` succeed as a no-op or reject as invalid? [OPEN DECISION - No repository evidence found for zero-delta mutation behavior].

### 32. Explicit Out-of-Scope
- Automatically refunding overpayments.
- Automatically lowering `requiredAdvance`.
- Creating `PaymentRecord`s.
- Modifying `quantity`, `productId`, `shippingCost`, or `discountAmount`.

---

**STATUS: READY FOR APPROVAL**
(Implementation halted until authorized)
