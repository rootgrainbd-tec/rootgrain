# Phase 8 Slice 4 — Price Revision
## Business Decision Freeze

**Status**: READY FOR FINAL SLICE 4 IMPLEMENTATION PLAN

### 1. CONFIRMED #1 — OVERPAYMENT
- **Rule**: If `newOrder.total < existing advancePaid`, then **REJECT PRICE REVISION**.
- **Reason**: `balanceDue` must never become negative. Negative payment/refund behavior is out of scope.
- **Source**: `0005R1-financial-model-payment-architecture-freeze.md` Sections 9, 10, 36.

### 2. CONFIRMED #2 — DISCOUNT
- **Rule**: `discountAmount` is an immutable checkout snapshot.
- **Restriction**: Price Revision MUST NOT recalculate promo percentages, re-evaluate promo configurations, or retroactively modify `discountAmount`.
- **Source**: `0005R1-financial-model-payment-architecture-freeze.md` Section 15.

### 3. BUSINESS DECISION #3 — REQUIRED ADVANCE
- **Rule**: If `newOrder.total < current Order.requiredAdvance`, then **REJECT PRICE REVISION**.
- **Restriction**: Do NOT automatically reduce `requiredAdvance`.
- **Reason**: 
  1. Slice 3 established: `requiredAdvance <= total`
  2. `requiredAdvance` is a production threshold.
  3. Automatically changing `requiredAdvance` during Price Revision would silently perform an Advance Revision.
  4. Advance Revision already has its own dedicated Slice 3 workflow. Therefore, if an Admin wants to lower `requiredAdvance`, they must use the separate Slice 3 Advance Revision feature.

### 4. BUSINESS DECISION #4 — PRICE REVISION ELIGIBILITY
- **Rule**: PRICE REVISION = MTO / CUSTOM ORDERS ONLY.
- **Conditions** (All must be true):
  - `isMtoOrder = true`
  - `productionState = NOT_STARTED`
  - `Order.status IN [PENDING_ADVANCE, CONFIRMED]`
  - `advancePaid < Order.total` (Order is not fully paid)
- **Fully Paid Rule**: FULLY PAID ORDER → **REJECT PRICE REVISION**. A fully paid order represents completed financial settlement against the current commercial price. Revising price after full payment would create unnecessary refund/credit complexity.
- **Rejection Matrix**: Price revision MUST be rejected if `productionState != NOT_STARTED`, OR `status NOT IN [PENDING_ADVANCE, CONFIRMED]`, OR `isMtoOrder != true`, OR `advancePaid >= total`, OR `newTotal < advancePaid`, OR `newTotal < requiredAdvance`.

#### Price Revision State Matrix
| MTO | Status | Production | Paid | Price Revision |
|-----|--------|------------|------|----------------|
| YES | PENDING_ADVANCE | NOT_STARTED | unpaid | ALLOW |
| YES | PENDING_ADVANCE | NOT_STARTED | partial | ALLOW |
| YES | CONFIRMED | NOT_STARTED | unpaid | ALLOW |
| YES | CONFIRMED | NOT_STARTED | partial | ALLOW |
| YES | any | IN_PROGRESS | any | REJECT |
| YES | any | COMPLETE | any | REJECT |
| YES | any | shipped/delivered | any | REJECT |
| YES | any | cancelled/rejected | any | REJECT |
| YES | eligible | NOT_STARTED | fully paid | REJECT |
| NO | any | any | any | REJECT |

### 5. BUSINESS DECISION #5 — PRICEREVISION MODEL
- **Rule**: `PriceRevision` is ITEM-LEVEL.
- **Schema Modification**: Add `orderItemId` to the `PriceRevision` model.
- **Relationship**: `PriceRevision` → `Order`, `PriceRevision` → `OrderItem`.
- **Required fields**: `id`, `orderId`, `orderItemId`, `previousProductPrice`, `adjustment`, `newProductPrice`, `reason`, `actor`, `createdAt`.
- **Constraint**: ONE REVISION = ONE ORDER ITEM. A single `PriceRevision` record represents exactly one `OrderItem` price change. Do NOT use `PriceRevision` as a flat Order-level adjustment.

### 6. MULTIPLE ITEM CHANGES
- **Rule**: If an Admin revises multiple `OrderItem`s, each `OrderItem` receives its own `PriceRevision` record.
- **Transaction**: ALL item revisions requested in one Admin operation MUST execute inside ONE database transaction.
- **Transaction Sequence**:
  1. Lock Order
  2. Lock affected OrderItems deterministically
  3. Validate ALL changes
  4. Calculate resulting Order totals
  5. Verify financial invariants
  6. Update all affected OrderItems
  7. Update Order totals
  8. Create one PriceRevision record per changed item
  9. Create the canonical OrderEvent
  10. Complete idempotency
- **Rollback**: If ANY item fails, ROLLBACK ALL ITEM PRICE CHANGES.

### 7. PRICE FORMULA
- Use existing repository price semantics:
  1. For each OrderItem: `itemTotal = unitPrice × quantity`
  2. `subtotal = SUM(OrderItem.total)`
  3. `total = subtotal + shippingCost - discountAmount`
- **Restrictions**: Do NOT recalculate `discountAmount`. Do NOT modify `shippingCost`. Do NOT modify `quantity`.

### 8. FINANCIAL INVARIANTS
After price revision, the following must hold true:
- `newTotal >= advancePaid`
- `newTotal >= requiredAdvance`
- `balanceDue >= 0`
- `advancePaid` unchanged
- `requiredAdvance` unchanged
- `PaymentRecord` unchanged
- `discountAmount` unchanged
- `shippingCost` unchanged
- `quantity` unchanged
- Product identity unchanged

### 9. BALANCE
- **Authoritative**: `balanceDue = newTotal - advancePaid`
- **Constraint**: If resulting value would be negative, REJECT. Do NOT create credit, refund, or negative balance.

### 10. PAYMENT BOUNDARY
- Price Revision MUST NOT:
  - Create payment
  - Void payment
  - Refund payment
  - Modify `PaymentRecord.amount`
  - Modify `PaymentRecord.status`
- Payment history remains immutable.

### 11. AUDIT HISTORY
- `PriceRevision` provides item-level revision history.
- Additionally create the canonical `OrderEvent`.
- Event should preserve: actor, orderId, changed items, previous prices, new prices, reason, timestamp.
- Do NOT duplicate financial mutation into multiple competing event systems.

### 12. DISCOUNT
- Keep `Order.discountAmount` UNCHANGED.
- Keep `Order.promoCode` UNCHANGED.
- Never recalculate historical promo percentage during Price Revision.

### 13. IMPLEMENTATION BOUNDARY
**Slice 4 MAY modify:**
- `OrderItem.unitPrice`
- `OrderItem.total`
- `Order.subtotal`
- `Order.total`
- `Order.balanceDue`

**Slice 4 MUST NOT modify:**
- `OrderItem.quantity`
- `OrderItem.productId`
- `Order.requiredAdvance`
- `Order.advancePaid`
- `PaymentRecord`
- `Order.shippingCost`
- `Order.discountAmount`
- `Order.promoCode`
- `productionState`
- `Order.status`

### 14. EXPLICIT OUT-OF-SCOPE
- Slice 4 implementation is completely out of scope for this document phase.
- Do NOT modify `schema.prisma`, `Order`, `OrderItem`, `PaymentService`, or Admin UI until the Final Implementation Plan is approved and authorized.
