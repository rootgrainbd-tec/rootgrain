# Phase 8 Slice 4 — Price Revision
## Deep Financial Audit & Implementation Plan

**Status**: READY FOR APPROVAL (BLOCKED ON AMBIGUITIES)

### 1. Objective
Design the implementation plan for Phase 8 Slice 4 (Price Revision) to allow an authorized Admin to revise the commercial price of an eligible Order while preserving financial correctness, payment history, and idempotency, adhering strictly to the approved Phase 8 architecture.

### 2. Authoritative Sources
- `0080-phase8-slice-architecture-approval.md`
- `schema.prisma` (Order, OrderItem, PaymentRecord, OrderEvent models)
- `payment.service.ts`, `checkout.service.ts`, `mto-admin.service.ts`

### 3. Repository Audit: Price Architecture & Source of Truth
**Source of Truth:** 
- The authoritative price components are stored at the `OrderItem` level (`unitPrice`, `quantity`, `total`).
- `Order` stores the aggregated snapshot: `subtotal`, `shippingCost`, `discountAmount`, `total`.
- Formula observed in `checkout.service.ts`: 
  `OrderItem.total = OrderItem.unitPrice * OrderItem.quantity`
  `Order.subtotal = SUM(OrderItem.total)`
  `Order.total = Order.subtotal + Order.shippingCost - Order.discountAmount`
- `Order.balanceDue` formula: `Order.total - Order.advancePaid` (derived directly during payments).

### 4. Mutation Scope
Per `0080`, the objective is to "revise the unit price of items." 
Therefore, the mutation MUST:
1. Modify `OrderItem.unitPrice` and recalculate `OrderItem.total`.
2. Recalculate `Order.subtotal`.
3. Recalculate `Order.total` (using existing shipping and discount snapshots).
4. Recalculate `Order.balanceDue`.

**Explicitly Out of Scope / Immutable:**
- `OrderItem.quantity`
- `OrderItem.productId` / identity
- Shipping costs
- `PaymentRecord` history (completely immutable)
- `advancePaid` (remains exactly as is)

### 5. Payment Interaction
- **Voided Payments:** Handled natively because `advancePaid` calculation currently sums only `COMPLETED` payments (per Slice 2).
- **Payment History:** `PaymentRecord` rows remain completely untouched.
- **Overpayment Behavior:** **[AMBIGUITY DETECTED - SEE BELOW]**

### 6. Advance Interaction
- `Order.requiredAdvance` is a policy threshold.
- If the new `total` decreases, does `requiredAdvance` get capped if it exceeds the new `total`? **[AMBIGUITY DETECTED]**
- Production threshold semantic (`advancePaid >= requiredAdvance`) is preserved natively, but changing `total` does not implicitly change `requiredAdvance` unless authorized.

### 7. Eligibility
- `Order.status` and `Order.productionState`: **[AMBIGUITY DETECTED]**
- MTO vs Standard Scope: `0080` does not restrict to MTO only, but standard e-commerce rarely negotiates price post-checkout. **[AMBIGUITY DETECTED]**

### 8. Price History
`0080` specifies: "Create `PriceRevision` model (id, orderId, previousProductPrice, adjustment, newProductPrice, reason, actor)." 
*Note:* Since an Order has multiple OrderItems, this model definition is ambiguous (missing `orderItemId`).

### 9. RBAC & Security
- Gate: `requirePermission("price.revise")`.
- `session.role === "ADMIN"` is strictly prohibited.
- `actorId` derived from `getServerSession()`.
- Client MUST NOT supply derived totals, balance, or advance amounts.

### 10. Concurrency & Idempotency
- **Transaction:** Single atomic `$transaction`.
- **Locking:** 
  1. `IdempotencyKey` upsert.
  2. `Order FOR UPDATE`.
  3. `OrderItem FOR UPDATE` (or updated directly within the transaction after Order lock).
- **Fingerprint:** `${orderId}:${orderItemId}:${newUnitPrice}:${reason}`.
- Replay yields stored payload; conflict throws 409.

### 11. Database Impact
Per `0080`, a new model is required:
```prisma
model PriceRevision {
  id                   String   @id @default(cuid())
  orderId              String
  orderItemId          String   // ADDED to resolve ambiguity
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
*Wait, prompt says "DO NOT CREATE MIGRATION". We will only document this impact.*

---

## CRITICAL AMBIGUITIES (BLOCKING EXECUTION)

Execution is **HALTED** per strict instruction: *"If any business rule is ambiguous: STOP and report the ambiguity. DO NOT infer from generic e-commerce behavior."*

Please provide authoritative rulings on the following:

**1. Overpayment Behavior (`newTotal < advancePaid`)**
If a price decrease causes the new `total` to be less than the already `advancePaid`:
- Should the revision be **REJECTED**?
- Or should it be **ALLOWED** (resulting in a negative `balanceDue` / refund liability)?

**2. Required Advance Cap**
If a price decrease causes the new `total` to be less than the current `requiredAdvance`:
- Should the revision be **REJECTED**?
- Should `requiredAdvance` be **AUTOMATICALLY REDUCED** to match the new `total`?
- Or should it be **ALLOWED** (meaning the threshold is impossibly higher than the total)?

**3. Discount Recalculation**
The `Order` stores an absolute `discountAmount` and `promoCode`, but NOT the percentage. If the original promo was 10%, should a price revision:
- Keep the `discountAmount` fixed as an absolute flat value? (Recommended for safety)
- Attempt to recalculate percentage discounts?

**4. Eligibility Rules**
- Can price be revised after `productionState` changes to `IN_PROGRESS` or `COMPLETE`?
- Can price be revised after the order is fully paid?
- Is this feature restricted to `isMtoOrder === true`, or applicable to standard checkout orders?

**5. PriceRevision Schema (Multi-item)**
`0080` defines `PriceRevision` without an `orderItemId`. Since orders can have multiple items, does Price Revision apply to a specific `OrderItem` (meaning we must add `orderItemId` to the schema), or is it a flat adjustment applied to the `Order.subtotal` directly?

---
**STATUS:** READY FOR APPROVAL (BLOCKED ON AMBIGUITIES). Do not start implementation.
