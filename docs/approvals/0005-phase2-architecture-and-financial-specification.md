# 0005-PHASE2-ARCHITECTURE-AND-FINANCIAL-SPECIFICATION

**Document:** docs/approvals/0005-phase2-architecture-and-financial-specification.md
**Status:** DESIGN FINALIZATION - AWAITING APPROVAL

## 1. Existing Inquiry vs new CustomRequest architecture.
- **VERIFIED EVIDENCE:** `model Inquiry` exists in Prisma. It stores name, phone, message, productId, but lacks user relations, image storage, or financial quoting fields. It is a simple contact form.
- **PROBLEM:** MTO inquiries need customer profile linkage, image attachments, and a clean pathway to become an Order. Re-using `Inquiry` mixes contact-us messages with complex product requests.
- **OPTIONS:** (1) Expand `Inquiry`. (2) Create `CustomRequest`.
- **RECOMMENDED OPTION:** Create a new `CustomRequest` model.
- **WHY:** Strictly separates standard contact forms from actionable, financially-bound custom product requests.
- **DATA MODEL IMPACT:** Add `CustomRequest` model linking to `User` and `Product` (optional), containing request details, images (JSON array), quotedPrice, and status.
- **API/SERVICE IMPACT:** New API endpoints for creating and managing custom requests.
- **UI IMPACT:** New Custom Order page in nav. Admin UI needs a new "Custom Requests" tab.
- **MIGRATION IMPACT:** None. Existing inquiries remain as contact messages.
- **REGRESSION RISK:** Low.
- **TEST REQUIREMENTS:** E2E test of custom request form submission.

## 2. Custom Request → Order conversion trigger.
- **VERIFIED EVIDENCE:** Orders are currently only created via `/api/checkout`. No conversion flow exists.
- **PROBLEM:** Once an admin quotes a CustomRequest, it must become an Order for the customer to pay the advance.
- **OPTIONS:** (1) Customer accepts quote and checks out. (2) Admin clicks "Convert to Order".
- **RECOMMENDED OPTION:** Admin clicks "Convert to Order".
- **WHY:** Custom requests often involve manual negotiation. Admin finalizing the details and generating the Provisional Order allows the customer to immediately receive a payment link.
- **DATA MODEL IMPACT:** `CustomRequest` gets an `orderId` relation.
- **API/SERVICE IMPACT:** Admin API endpoint to trigger Order creation from CustomRequest.
- **UI IMPACT:** "Convert to Order" button in Admin CustomRequest view.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** Low.
- **TEST REQUIREMENTS:** Ensure conversion copies customer details, agreed price, and sets delivery to TBD.

## 3. Order financial model.
- **VERIFIED EVIDENCE:** `Order` schema contains scalar `advancePaid`, `balanceDue`, `subtotal`, `shippingCost`, `total`, `discountAmount`.
- **PROBLEM:** Hardcoded scalars lead to state desync if payments or prices change.
- **OPTIONS:** (1) Keep scalar updates. (2) Fully compute. (3) Keep scalars as cache but enforce strict transactional updates.
- **RECOMMENDED OPTION:** Keep scalars as cache but enforce strict transactional updates via a unified Financial Engine.
- **WHY:** Performance is maintained for UI reads, but integrity is guaranteed by routing all mutations through a single service that recalculates `balanceDue = total - SUM(PaymentRecord)`.
- **DATA MODEL IMPACT:** None to `Order` directly.
- **API/SERVICE IMPACT:** All payment mutations must use the Financial Engine.
- **UI IMPACT:** None directly.
- **MIGRATION IMPACT:** None (0 existing PaymentRecords).
- **REGRESSION RISK:** High if legacy updates bypass the new Financial Engine.
- **TEST REQUIREMENTS:** Unit tests verifying summation and cache updating.

## 4. PaymentRecord lifecycle and multiple payments.
- **VERIFIED EVIDENCE:** `PaymentRecord` exists but has 0 rows in production.
- **PROBLEM:** Currently `advancePaid` is overwritten directly. Multiple payments cannot be tracked.
- **OPTIONS:** (1) Modify `advancePaid`. (2) Use `PaymentRecord` as append-only ledger.
- **RECOMMENDED OPTION:** Use `PaymentRecord` as append-only ledger.
- **WHY:** Allows true historical tracking of installments (Advance, Mid-production, COD).
- **DATA MODEL IMPACT:** `PaymentRecord` becomes mandatory for all financial inflows.
- **API/SERVICE IMPACT:** Admin manual payment entry creates a `PaymentRecord` instead of updating `advancePaid` directly.
- **UI IMPACT:** Admin order view shows a table of payments.
- **MIGRATION IMPACT:** None (0 historical records).
- **REGRESSION RISK:** Medium. Admin status modal must be rewritten to insert `PaymentRecord`.
- **TEST REQUIREMENTS:** Verify multiple payments correctly sum to `Total Paid`.

## 5. Advance Required vs Suggested Advance.
- **VERIFIED EVIDENCE:** `advanceRequired = order.total * 0.2` is hardcoded in `email.ts` and `pdfGenerator.ts`.
- **PROBLEM:** Admin cannot negotiate or change the required advance.
- **OPTIONS:** (1) Keep hardcoded. (2) Add `advanceRequired` to `Order`.
- **RECOMMENDED OPTION:** Add `advanceRequired` to `Order`, defaulting to 20% on creation.
- **WHY:** Allows Admin to override the requirement (e.g., demanding 50% for high-risk custom orders).
- **DATA MODEL IMPACT:** Add `advanceRequired Int @default(0)` (populated at creation).
- **API/SERVICE IMPACT:** Admin endpoint to update `advanceRequired`.
- **UI IMPACT:** Admin UI field to edit `advanceRequired`.
- **MIGRATION IMPACT:** Low. Existing test orders get default 0 or can be backfilled.
- **REGRESSION RISK:** Medium. Email and PDF must read from DB instead of hardcoding calculation.
- **TEST REQUIREMENTS:** Verify PDF displays the DB value.

## 6. Total Paid and Balance Due calculation.
- **VERIFIED EVIDENCE:** `balanceDue` is a scalar on `Order`.
- **PROBLEM:** Out of sync if manual changes occur.
- **OPTIONS:** (1) Calculate on the fly. (2) Strict cache.
- **RECOMMENDED OPTION:** Strict cache (`balanceDue` = `Final Total` - `SUM(COMPLETED PaymentRecords)`).
- **WHY:** Ensures fast DB queries while maintaining accuracy.
- **DATA MODEL IMPACT:** None.
- **API/SERVICE IMPACT:** Financial Engine recalculates and saves cache on every PaymentRecord insert/update.
- **UI IMPACT:** None.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** Low.
- **TEST REQUIREMENTS:** Unit tests.

## 7. Payment correction/void/idempotency rules.
- **VERIFIED EVIDENCE:** No existing void or correction mechanism.
- **PROBLEM:** Human error in Admin payment entry requires correction without database deletion.
- **OPTIONS:** (1) Allow DELETE. (2) Append-only voids (Negative payment). (3) Status change to `FAILED`/`REFUNDED`.
- **RECOMMENDED OPTION:** Status change to `FAILED`/`REFUNDED` for corrections.
- **WHY:** Simplest approach that maintains immutable audit trails without complex double-entry accounting.
- **DATA MODEL IMPACT:** `PaymentStatus` enum already includes `FAILED` and `REFUNDED`.
- **API/SERVICE IMPACT:** Admin endpoint to change `PaymentRecord` status.
- **UI IMPACT:** Admin UI void button.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** Low.
- **TEST REQUIREMENTS:** Changing status to FAILED must immediately revert `Total Paid` and increase `balanceDue`.

## 8. MTO price revision and immutable history.
- **VERIFIED EVIDENCE:** No price revision history exists.
- **PROBLEM:** MTO prices can change due to production cost shifts, but changing `subtotal` erases original agreed price.
- **OPTIONS:** (1) Change `subtotal` silently. (2) Add `PriceRevision` model.
- **RECOMMENDED OPTION:** Add `PriceRevision` model.
- **WHY:** Preserves the history of the agreement and notifies the customer legitimately.
- **DATA MODEL IMPACT:** New `PriceRevision` model (orderId, oldPrice, newPrice, reason, adminId).
- **API/SERVICE IMPACT:** Admin endpoint to revise price. Recalculates `Order.subtotal` and `Order.total`.
- **UI IMPACT:** Admin UI to add revision. Customer timeline shows price change.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** Medium. Ensure balance calculations respect the new subtotal.
- **TEST REQUIREMENTS:** Price revision correctly alters balance due.

## 9. Promo vs price adjustment separation.
- **VERIFIED EVIDENCE:** `promoCode` and `discountAmount` exist on `Order`.
- **PROBLEM:** Price revisions shouldn't mess with promo logic.
- **OPTIONS:** (1) Deduct promo from subtotal. (2) Keep separate.
- **RECOMMENDED OPTION:** Keep strictly separate.
- **WHY:** Promo is a fixed discount event at checkout. Price revision alters the base cost of the physical good.
- **DATA MODEL IMPACT:** None.
- **API/SERVICE IMPACT:** Financial Engine logic: `Total = (Subtotal +/- PriceRevisions) - Discount + Shipping`.
- **UI IMPACT:** Invoices show Original Price, Revisions, Promo, Shipping.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** Low.
- **TEST REQUIREMENTS:** Math verification.

## 10. Delivery Charge = TBD initially, Admin-defined later.
- **VERIFIED EVIDENCE:** `shippingCost` is an `Int`.
- **PROBLEM:** MTO delivery cannot be calculated at checkout.
- **OPTIONS:** (1) Set to 0. (2) Nullable `shippingCost`. (3) Flag `isDeliveryTbd`.
- **RECOMMENDED OPTION:** Add `isDeliveryTbd Boolean @default(false)`.
- **WHY:** A shipping cost of 0 might mean "Free Shipping". A flag explicitly marks it as "To Be Determined".
- **DATA MODEL IMPACT:** Add `isDeliveryTbd` to `Order`.
- **API/SERVICE IMPACT:** Financial Engine treats TBD as 0 for current balance, but UI displays "TBD".
- **UI IMPACT:** Checkout, Invoices, Emails display "TBD" instead of "৳0".
- **MIGRATION IMPACT:** Existing orders get `false`.
- **REGRESSION RISK:** Medium. UI components expecting numbers might error.
- **TEST REQUIREMENTS:** UI renders "TBD".

## 11. Final Total calculation.
- **VERIFIED EVIDENCE:** Total is fixed at checkout.
- **PROBLEM:** Needs to be dynamic to support Revisions and Admin-defined delivery.
- **OPTIONS:** (1) Recalculate on read. (2) Recalculate and update `total` cache on write.
- **RECOMMENDED OPTION:** Recalculate and update `total` cache on write.
- **WHY:** Safe, performant, guarantees DB queries for `balanceDue > 0` are fast.
- **DATA MODEL IMPACT:** None.
- **API/SERVICE IMPACT:** Enforced via Financial Engine.
- **UI IMPACT:** None.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** High if legacy updates bypass engine.
- **TEST REQUIREMENTS:** Engine unit tests.

## 12. COD as a payment event.
- **VERIFIED EVIDENCE:** `PaymentMethod.COD` exists.
- **PROBLEM:** COD is just a method, but historically meant "unpaid".
- **OPTIONS:** (1) Ignore COD. (2) Treat COD collection as a PaymentRecord.
- **RECOMMENDED OPTION:** Treat COD collection as a `PaymentRecord` with status `COMPLETED`.
- **WHY:** Closes the ledger cleanly.
- **DATA MODEL IMPACT:** None.
- **API/SERVICE IMPACT:** Admin "Mark COD Received" creates `PaymentRecord`.
- **UI IMPACT:** Button in Admin UI.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** Low.
- **TEST REQUIREMENTS:** E2E admin flow.

## 13. Exact financial document lifecycle.
- **VERIFIED EVIDENCE:** One static PDF generation flow in `pdfGenerator.ts`.
- **PROBLEM:** Cannot represent Provisional vs Final states.
- **OPTIONS:** (1) One generic invoice. (2) State-aware document headers.
- **RECOMMENDED OPTION:** State-aware document headers.
  - If `isDeliveryTbd` = PROVISIONAL ORDER CONFIRMATION
  - If Payments exist = PAYMENT RECEIPT
  - If Delivered = FINAL INVOICE
- **WHY:** Meets business reality without creating 5 different PDF generators.
- **DATA MODEL IMPACT:** None.
- **API/SERVICE IMPACT:** `pdfGenerator.ts` uses conditional titles based on Order state.
- **UI IMPACT:** Document titles change contextually.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** Low.
- **TEST REQUIREMENTS:** PDF generation logic tests.

## 14. Shared financial source for HTML and PDF documents.
- **VERIFIED EVIDENCE:** `/checkout/invoice/page.tsx` and `pdfGenerator.ts` are heavily mismatched.
- **PROBLEM:** Two sources of truth for financial display.
- **OPTIONS:** (1) Fix both manually. (2) Create unified Data Builder.
- **RECOMMENDED OPTION:** Create `FinancialDocumentBuilder` service.
- **WHY:** Both HTML and PDFkit simply consume a standardized JSON object containing exact localized strings, line items, and totals.
- **DATA MODEL IMPACT:** None.
- **API/SERVICE IMPACT:** New service class `FinancialDocumentBuilder`.
- **UI IMPACT:** `invoice/page.tsx` refactored to use builder.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** Medium.
- **TEST REQUIREMENTS:** Ensure HTML and PDF output identical numbers.

## 15. Customer Document Vault architecture.
- **VERIFIED EVIDENCE:** No vault exists.
- **PROBLEM:** Customer cannot find old receipts.
- **OPTIONS:** (1) Store PDFs in S3. (2) Generate on the fly via secure route.
- **RECOMMENDED OPTION:** Generate on the fly via secure route (`/api/documents/invoice?orderId=...`).
- **WHY:** Avoids storage costs and sync issues if prices are revised. Documents always reflect the immutable DB state accurately.
- **DATA MODEL IMPACT:** None.
- **API/SERVICE IMPACT:** New API route returning PDF stream, protected by session/guest token.
- **UI IMPACT:** Customer Profile gets a "Documents" tab with download links.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** Low.
- **TEST REQUIREMENTS:** Auth checks on PDF route.

## 16. OrderEvent vs Customer Notification separation.
- **VERIFIED EVIDENCE:** No tracking timeline or notification system exists.
- **PROBLEM:** Customers don't have a timeline.
- **OPTIONS:** (1) Use Order status only. (2) Add `OrderEvent` model and `Notification` model.
- **RECOMMENDED OPTION:** Add `OrderEvent` for immutable timeline history, `Notification` for user alerts.
- **WHY:** `OrderEvent` acts as the audit log (e.g., "Price revised by admin"). `Notification` acts as the unread/read alert for the customer UI.
- **DATA MODEL IMPACT:** Add `OrderEvent` and `Notification` models.
- **API/SERVICE IMPACT:** Financial Engine and Admin updates emit events.
- **UI IMPACT:** Order Tracking page reads `OrderEvent`. Profile reads `Notification`.
- **MIGRATION IMPACT:** Low.
- **REGRESSION RISK:** Low.
- **TEST REQUIREMENTS:** Event emission checks.

## 17. Email + WhatsApp + In-App notification architecture.
- **VERIFIED EVIDENCE:** Hardcoded Resend calls scattered in codebase. No WA.
- **PROBLEM:** Brittle and repetitive.
- **OPTIONS:** (1) Keep inline. (2) Central `NotificationDispatcher`.
- **RECOMMENDED OPTION:** Central `NotificationDispatcher`.
  - UNKNOWN — REQUIRES BUSINESS DECISION: Which WhatsApp provider to use.
- **WHY:** Allows graceful fallback. If WA fails, email still sends. Abstracted logic.
- **DATA MODEL IMPACT:** None.
- **API/SERVICE IMPACT:** New Dispatcher service wrapping Resend and future WA client.
- **UI IMPACT:** None.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** High. Must meticulously replace existing `sendOrderConfirmationEmail` calls.
- **TEST REQUIREMENTS:** Ensure emails still fire.

## 18. MTO status model and whether READY is actually necessary.
- **VERIFIED EVIDENCE:** `PROCESSING` exists. No `READY`.
- **PROBLEM:** `PROCESSING` implies production. We need a state indicating it is built but waiting for dispatch/delivery charge.
- **OPTIONS:** (1) Skip READY. (2) Add `READY_FOR_DISPATCH`.
- **RECOMMENDED OPTION:** Add `READY_FOR_DISPATCH` to `OrderStatus`.
- **WHY:** Critical operational milestone for admin to apply delivery charges before dispatch.
- **DATA MODEL IMPACT:** Update `OrderStatus` enum.
- **API/SERVICE IMPACT:** Admin transition logic.
- **UI IMPACT:** Admin status dropdown.
- **MIGRATION IMPACT:** Prisma schema change required.
- **REGRESSION RISK:** Low.
- **TEST REQUIREMENTS:** Test status transition validation.

## 19. Customer profile snapshot vs current profile data.
- **VERIFIED EVIDENCE:** `shippingAddress` is stored as JSON on `Order`.
- **PROBLEM:** If a user updates their global profile, old invoices shouldn't change.
- **OPTIONS:** (1) Relation. (2) JSON Snapshot.
- **RECOMMENDED OPTION:** Keep JSON Snapshot.
- **WHY:** Required for financial immutability.
- **DATA MODEL IMPACT:** None.
- **API/SERVICE IMPACT:** None.
- **UI IMPACT:** None.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** None.
- **TEST REQUIREMENTS:** None.

## 20. Admin workflow.
- **VERIFIED EVIDENCE:** `OrdersTable.tsx` lacks filters.
- **PROBLEM:** Unmanageable for scale.
- **OPTIONS:** (1) Basic pagination. (2) Unified Dashboard with tabs (Regular/MTO/Custom).
- **RECOMMENDED OPTION:** Unified Dashboard with Data Table filters (Status, Type, Payment Due).
- **WHY:** Required for operational efficiency.
- **DATA MODEL IMPACT:** None.
- **API/SERVICE IMPACT:** Admin fetch queries need filter parameters.
- **UI IMPACT:** Refactor `OrdersTable.tsx` to use Shadcn Data Table with faceted filters.
- **MIGRATION IMPACT:** None.
- **REGRESSION RISK:** Low.
- **TEST REQUIREMENTS:** UI filter testing.

## 21. Database migration impact.
- **VERIFIED EVIDENCE:** 9 Test Orders. 0 Payment Records.
- **RECOMMENDED OPTION:** Standard Prisma migration.
- **WHY:** No real data to protect.
- **MIGRATION IMPACT:** Extremely safe.

## 22. Backup requirements.
- **VERIFIED EVIDENCE:** Hosted on Supabase.
- **RECOMMENDED OPTION:** Trigger manual pg_dump or Supabase dashboard backup before Prisma migrate.

## 23. Safe rollback strategy.
- **VERIFIED EVIDENCE:** Next.js deployed on Vercel.
- **RECOMMENDED OPTION:** Vercel instant rollback. Drop newly added tables if necessary.

## 24. Regression risks.
- **VERIFIED EVIDENCE:** PDF generation and Checkout are sensitive.
- **RECOMMENDED OPTION:** Wrap all new logic in try-catch. Do not modify the core `createOrder` Prisma transaction without exhaustive testing.

## 25. Exact implementation dependency graph.
- **RECOMMENDED OPTION:**
  1. `Prisma Schema Updates` (CustomRequest, OrderEvent, Notification, PriceRevision, OrderStatus).
  2. `Financial Engine Core` (Unified math functions).
  3. `Document Builder` (HTML + PDF synchronization).
  4. `Notification Dispatcher` (Abstracting Email).
  5. `Admin Dashboard UI` (Payments + Filters + Conversions).
  6. `Customer Facing UI` (Custom Request Form, Vault, Buy Now).

---

# FINAL FROZEN ARCHITECTURE

### CORE FLOW
CUSTOM REQUEST → ADMIN REVIEW → PRICE SET
→ CONVERT TO ORDER (Provisional, Delivery TBD)
→ ADVANCE PAYMENT (PaymentRecord inserted, status CONFIRMED)
→ PRODUCTION (Status PROCESSING)
→ PRICE REVISION IF ANY (PriceRevision inserted, Event Logged)
→ READY_FOR_DISPATCH
→ DELIVERY CHARGE ADDED
→ FINAL INVOICE GENERATED
→ DISPATCHED
→ COD/BALANCE PAYMENT (PaymentRecord inserted)
→ DELIVERED

### NOTIFICATION FLOW
Order Mutation → OrderEvent Emitted → Notification Dispatcher
→ In-App Notification (Database)
→ Email (Resend)
→ WhatsApp (Pending Provider)

### FINANCIAL SOURCE OF TRUTH
Database (Order + PaymentRecord + PriceRevision)
→ FinancialDocumentBuilder
→ /checkout/invoice (HTML)
→ pdfGenerator (PDF via Email/Vault)
