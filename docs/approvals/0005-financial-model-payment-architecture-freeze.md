# ROOTGRAIN — PHASE 1 FINANCIAL MODEL & PAYMENT ARCHITECTURE FREEZE

**Document ID:** 0005-financial-model-payment-architecture-freeze.md  
**Status:** AWAITING APPROVAL  
**Date:** 2026-08-15

---

## 1. Executive Summary

This document freezes the financial model, payment architecture, and document architecture for RootGrain before executing Phase 1 of the Customer Experience Upgrade. Read-only forensic analysis confirms that the database contains a `PaymentRecord` schema model, but the actual administrative flow for advances purely mutates the integer `advancePaid` field on the `Order` model. A true Payment Ledger is currently missing from active use. Furthermore, synchronous PDF generation poses a failure risk to email dispatch. This freeze defines the exact minimum changes required to safeguard financial data and maintain backwards compatibility.

---

## 2. Current Financial Architecture

The following table summarizes the implementation of core financial concepts discovered in the repository:

| Financial Concept | Exists? | Model | Field | Written Where | Read Where | Evidence |
|-------------------|---------|-------|-------|---------------|------------|----------|
| Product Subtotal | YES | `Order` | `subtotal` | `CheckoutService` | `OrdersTable`, `email.ts` | Schema: line 38 |
| Promo Discount | YES | `Order` | `discountAmount` | `CheckoutService` | `OrdersTable`, `email.ts` | Schema: line 46 |
| Delivery Charge | YES | `Order` | `shippingCost` | `CheckoutService` | `OrdersTable`, `email.ts` | Schema: line 39 |
| Grand Total | YES | `Order` | `total` | `CheckoutService` | `OrdersTable`, `email.ts` | Schema: line 40 |
| Advance Paid | YES | `Order` | `advancePaid` | `OrderService.updateOrderStatus` | `OrdersTable` | Schema: line 41 |
| Balance Due | YES | `Order` | `balanceDue` | `CheckoutService`, `OrderService` | `OrdersTable` | Schema: line 42 |
| Payment Ledger | INCOMPLETE | `PaymentRecord` | N/A | Schema only (Not actively written by Admin UI) | N/A | `OrdersTable.tsx` line 195 updates `advanceAmount` |

---

## 3. Commercial Calculation

**Formula implemented in `CheckoutService.processCheckout`:**
```ts
total = subtotal + shippingCost - discountAmount;
```
**Formula implemented in `OrderService.updateOrderStatus` (upon CONFIRM):**
```ts
balanceDue = currentOrder.total - advancePaidAmount;
```

- Both calculations are strictly server-side authoritative.
- The UI exposes visual read-only representations.
- Rounding behavior: Handled entirely as integer (`Math.floor` on percentage promos).
- Currency handling: Handled strictly as BDT integer values.

---

## 4. Promo Snapshot

**Verified:** The promo logic is completely snapshotted into the `Order`.
When a customer checks out, `CheckoutService` evaluates the promo and calculates an integer `discountAmount`. This integer, along with the `promoCode` string, is permanently stored in the `Order` table. 
**Conclusion:** If the promo configuration changes tomorrow, an old order's financial amount **cannot** change.

---

## 5. Delivery Snapshot

**Verified:** Delivery logic is completely snapshotted.
`CheckoutService` invokes `ShippingEngine.calculate()` and stores the resulting integer exactly into `Order.shippingCost`.
**Conclusion:** If delivery pricing changes tomorrow, an old order's delivery charge **cannot** change.

---

## 6. Advance Model

A fixed 20% advance is merely a frontend visual suggestion (`advanceRequired = total * 0.2` in PDF and checkout UI).
The actual backend enforces no such limit.
When an Admin marks an order as `CONFIRMED` in `OrdersTable.tsx`, they manually input an arbitrary integer string (`advanceAmount`) into a modal. This arbitrary value is written directly to `Order.advancePaid`.

* A. Suggested Advance: Handled implicitly in UI (20%).
* B. Actual Advance Required: Not stored natively (implied by Admin agreement).
* C. Actual Payment Received: Represented by `advancePaid`.
* D. Total Paid: Equivalent to `advancePaid` currently.
* E. Balance Due: Overwritten synchronously based on `advancePaid`.

---

## 7. Payment Model

Currently, RootGrain does NOT have a true functioning payment ledger.
Although `prisma/schema.prisma` contains:
```prisma
model PaymentRecord { ... amount, status, method, type ... }
```
The actual `OrderService.updateOrderStatus` does **not** create a `PaymentRecord` when the admin confirms the advance. It merely updates `Order.advancePaid` directly.
Thus, multiple sequential payments (e.g., Payment #1 = ৳3,000, Payment #2 = ৳2,000) **cannot** be historically represented without overwriting the single `advancePaid` integer field.

**PAYMENT LEDGER = INCOMPLETE (Schema exists, implementation missing).**

---

## 8. Payment Ledger

Because the application currently stores `advancePaid` statically, moving to a true ledger requires adopting the existing `PaymentRecord` schema model.

**Recommendation:**
`PaymentRecord` should be written to for every financial receipt.
`Total Paid` should technically be `SUM(valid payments)`.
However, for read-heavy efficiency, `Order.advancePaid` (or a renamed `totalPaid`) can remain as a **stored cache**, updated transactionally whenever a `PaymentRecord` is created.

---

## 9. Balance Model

Currently, `balanceDue` is a **Stored** integer.
It is recalculated in `OrderService` as:
`updateData.balanceDue = currentOrder.total - advancePaidAmount;`

**Recommendation:** Maintain `balanceDue` as a **Stored Cache** protected by a server-side invariant. The application must explicitly throw `ValidationError` if calculating the balance results in a negative value (unless explicit overpayment modeling is introduced).

---

## 10. Financial Invariants

The following invariants MUST be enforced in code (currently not universally protected):
1. `Grand Total >= 0`
2. `Payment Amount > 0`
3. `Total Paid >= 0`
4. `Total Paid <= Grand Total`
5. `Balance Due >= 0`
6. `Balance Due = Grand Total - Total Paid`

---

## 11. Order Status vs Payment State

Currently, payment state is conflated with order status.
- `CONFIRMED` implies advance was received.
- There is no separate `PaymentState` enum.

**Recommended Future Behavior:**
Order Status remains logistical (`PENDING`, `CONFIRMED`, `PROCESSING`, etc.).
A new `PaymentStatus` concept (e.g., `PARTIAL`, `PAID_IN_FULL`) can remain implicit via invariants (`balanceDue === 0`) to avoid over-engineering, or be explicitly recorded. For RootGrain's current scale, deriving `isFullyPaid` from `balanceDue === 0` is the safest minimum change.

---

## 12. Document Model

**Currently Exists:**
- Initial Order Confirmation (PDF + Email)

**Missing / To Be Designed:**
- Dedicated Advance Payment Receipt
- Operational Status Documents (HTML Emails already exist, PDF not strictly needed).

---

## 13. Existing PDF Architecture

The system uses `pdfkit`. The configuration `serverExternalPackages: ['pdfkit']` and font mapping is already correctly configured in production.
**Recommendation:** Completely reuse `src/lib/pdfGenerator.ts`. Do not introduce Puppeteer or HTML-to-PDF engines. Extend the existing PDF generator to support a "Payment Receipt" mode.

---

## 14. Email/PDF Relationship

- **Initial Email:** Sends PDF synchronously.
- **Status Emails:** Send HTML only.
**Recommendation:** Keep status emails lightweight (HTML only). Only generate PDFs for actual financial moments (Initial Order, and Payment Receipt).

---

## 15. PDF Failure Strategy

**Current Flaw:** `await generateInvoicePDF(order)` blocks the `Resend` dispatch. If the PDF fails (e.g., font buffer missing), the customer receives **no email at all**.

**Recommendation:** PDF generation must be wrapped in a `try/catch`. If PDF generation fails, the system should log the severe error but **still send the HTML email** gracefully without the attachment.

---

## 16. Data Migration Impact

Moving to a functional `PaymentRecord` ledger requires migrating historical data.
**Strategy:**
For every existing order where `advancePaid > 0` and no `PaymentRecord` exists:
A background script (or one-time migration) must create a synthetic `PaymentRecord` (Type: `ADVANCE`, Status: `COMPLETED`, Amount: `advancePaid`) so the ledger balances perfectly with the cached `advancePaid` total.

---

## 17. Backward Compatibility

By keeping `advancePaid` and `balanceDue` as cached fields on the `Order` model, all existing admin views (`OrdersTable.tsx`), customer views, and email templates will continue to function seamlessly without immediately requiring complex relational SQL queries in the frontend.

---

## 18. Backup Requirements

Prior to executing any code or schema changes, the following MUST be secured:
1. Current Production Commit SHA recorded.
2. Full logical Database Dump (Postgres `pg_dump`).
3. Vercel Environment variables snapshot.
4. Local testing of the Git baseline.

---

## 19. Migration Risk Matrix

| Change | Existing Data Risk | Migration Risk | Rollback | Required Backup |
|---|---|---|---|---|
| Enforce `PaymentRecord` writes | HIGH | MEDIUM | Code revert | DB Dump |
| PDF Try/Catch Isolation | LOW | LOW | Code revert | Git SHA |
| Negative Balance Invariants | MEDIUM | LOW | Code revert | Git SHA |

---

## 20. Minimum Change Set

1. Add `try/catch` around PDF generation in `email.ts`.
2. Update `OrderService.updateOrderStatus` to write to `Prisma.PaymentRecord.create` when processing advances.
3. Add hard invariants to `OrderService` preventing `balanceDue < 0`.

---

## 21. Proposed Future Model

**ORDER**
- `subtotal`, `discountAmount`, `shippingCost`, `total` (Immutable after checkout)
- `advancePaid`, `balanceDue` (Mutable, Cached)

**PAYMENT_RECORD**
- `orderId`, `amount`, `method`, `status`, `paidAt` (Append-only Ledger)

---

## 22. Over-Engineering Rejections

- **NO** third-party payment gateways (Stripe/SSLCommerz) yet.
- **NO** dedicated `Invoice` schema model (Order is the Invoice).
- **NO** multi-currency structures.
- **NO** separate Refunds table (Negative payment records or status flags suffice).

---

## 23. Implementation Slices

**Slice 1: Structural Safety**
- PDF generation try/catch isolation.
- Server-side financial invariants (no negative balances).

**Slice 2: Payment Ledger Activation**
- Modify `OrderService.updateOrderStatus` to populate `PaymentRecord`.
- Migration script for historical orders.

**Slice 3: Financial Documents**
- Extend `pdfGenerator.ts` to support Payment Receipts.
- Dispatch Payment Receipt on `PaymentRecord` creation.

---

## 24. Test Matrix

- **Financial:** Assert `balanceDue = total - totalPayments`. Assert `PaymentAmount > 0`. Assert `AdvancePaid <= Total`.
- **Status:** Assert status transitions maintain financial integrity.
- **Documents:** Assert PDF attaches when successful, falls back gracefully when failed.
- **Regression:** Assert legacy guest tracking still functions.

---

## 25. Production Verification Gate

1. Test order created successfully.
2. Initial email + PDF received successfully.
3. Advance payment inputted by Admin creates `PaymentRecord`.
4. `advancePaid` and `balanceDue` accurately reflect the sum of ledgers.
5. Legacy orders display correctly.

---

## 26. Final Decision

### CURRENT MODEL
Missing Payment Ledger implementation. Vulnerable to negative advances. PDF failures block email delivery.

### REQUIRED MODEL
Append-only Payment Ledger. Safe balance invariants. Resilient email dispatch.

### MINIMUM CHANGE SET
Activate existing `PaymentRecord` schema via `OrderService`. Add invariants. Try/catch PDF.

### GO / NO-GO
`READY FOR IMPLEMENTATION APPROVAL`
