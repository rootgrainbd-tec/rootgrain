# Phase 8 Slice 4 — Price Revision
## Ambiguity Resolution Audit

**Status**: BUSINESS DECISION REQUIRED

### 1. AMBIGUITY #1 — OVERPAYMENT
**Question**: What happens when a price decrease results in `newOrder.total < existing advancePaid`?
**Repository Evidence**: `payment.service.ts` line 147 explicitly prevents payments from exceeding `total`.
**Authoritative Document Evidence**: 
- `0005R1` Section 9 enforces the invariant: `Balance Due >= 0`.
- `0005R1` Section 36 confirms: "Can the system prevent negative balance? YES".
- `0005R1` Section 10 states: "NO NEGATIVE PAYMENT REFUNDS. Refunds are explicitly out of scope."
**Decision**: Reject price revision.
**Exact Source**: `0005R1-financial-model-payment-architecture-freeze.md` (§9, §10, §36)
**Confidence**: HIGH

### 2. AMBIGUITY #2 — REQUIRED ADVANCE CAP
**Question**: What happens when a price decrease results in `newOrder.total < current requiredAdvance`?
**Repository Evidence**: `payment.service.ts` line 544 (Advance Revision) blocks `newRequiredAdvance > order.total`.
**Authoritative Document Evidence**: `0089` Advance Revision plan confirms the invariant: `requiredAdvance <= total`. However, no document specifies what happens when a *Price Revision* side-effect causes this invariant to be violated (e.g., whether to auto-cap it or reject the transaction).
**Decision**: UNRESOLVED — BUSINESS DECISION REQUIRED

### 3. AMBIGUITY #3 — DISCOUNT
**Question**: If `total` changes, do we recalculate percentage discounts, or keep `discountAmount` fixed?
**Repository Evidence**: `schema.prisma` stores only `discountAmount` (Int) and `promoCode` (String), omitting the percentage value.
**Authoritative Document Evidence**: `0005R1` Section 15 states: "PROMO SNAPSHOT. Promotional discounts will continue to be safely snapshotted as `discountAmount` upon checkout. Changes to promo configurations will never retroactively modify historical financial snapshots."
**Decision**: Discount is an immutable monetary snapshot. Do NOT recalculate percentage.
**Exact Source**: `0005R1-financial-model-payment-architecture-freeze.md` (§15)
**Confidence**: HIGH

### 4. AMBIGUITY #4 — ELIGIBILITY
**Question**: When is Price Revision allowed (production state, paid state, MTO vs Standard)?
**Repository Evidence**: None (Feature does not exist yet).
**Authoritative Document Evidence**: `0080` Phase 8 Architecture Approval outlines the objective to "revise the unit price of items" but does not define any eligibility constraints, state matrix, or MTO-exclusivity for this mutation.
**Decision**: UNRESOLVED — BUSINESS DECISION REQUIRED
**Affected Matrix**:
| Status | ProductionState | Paid State | MTO | Price Revision |
|---|---|---|---|---|
| ALL | ALL | ALL | ALL | UNRESOLVED |

### 5. AMBIGUITY #5 — PRICEREVISION MODEL
**Question**: Does `PriceRevision` apply to a specific OrderItem, the Order as a whole, or multiple items?
**Repository Evidence**: `OrderItem` has `productId` and `unitPrice`.
**Authoritative Document Evidence**: `0080` Phase 8 Architecture Approval Section 12 specifies the schema: `id, orderId, previousProductPrice, adjustment, newProductPrice, reason, actor`. 
**Remaining Ambiguity**: The term `previousProductPrice` implies item-level semantics, but the schema omits an `orderItemId`. Since an order can contain multiple items, it is impossible to determine *which* item's `productPrice` was revised without adding `orderItemId`. It is unclear if we are authorized to add `orderItemId` or if this was intended as a flat Order-level adjustment.
**Decision**: UNRESOLVED — BUSINESS DECISION REQUIRED

---

**FINAL STATUS**: BUSINESS DECISION REQUIRED
(Do not implement Slice 4).
