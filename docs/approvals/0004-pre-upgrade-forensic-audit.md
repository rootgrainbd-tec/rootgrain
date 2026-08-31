# 0004 Pre-Upgrade Forensic Audit

**Status:** APPROVED FOR PLANNING
**Type:** Read-Only Audit & Risk Assessment
**Date:** 2026-08-15

## Objective
This document outlines the findings of a read-only forensic audit and risk assessment of the RootGrain production system. It evaluates the current state of the architecture to prepare for a major Customer Experience (CX) and Admin Operations upgrade.

---

## PART 1 — COMPLETE EXISTING SYSTEM INVENTORY

### 1. Order Tracking Page
- **Status:** Partially Exists (No Dedicated UI)
- **Details:** The backend supports guest tracking capability tokens (`generateGuestTrackingToken`, `hashGuestTrackingToken` in `src/lib/capability-token.ts`), and `OrderService.getOrderDetails` validates these tokens. However, there is no dedicated `/track` standalone page for guests to enter their order number and token. Tracking is currently only visible within the authenticated `/account/orders` page.

### 2. Order Status Timeline
- **Status:** Partially Exists
- **Details:** A React component `<OrderTracker status={order.status} />` exists and is rendered on the `/account/orders` page. It provides a visual representation of the current status based on the Prisma `OrderStatus` enum.

### 3. Customer Order History
- **Status:** Exists (Basic)
- **Details:** Located at `src/app/(storefront)/account/orders/page.tsx`. It fetches orders via `prisma.order.findMany({ where: { userId: session.user.id } })` and displays a list of cards with items, subtotals, shipping, discount, advance paid, and pending balance. It is functional but basic.

### 4. Email Content/Design Polish
- **Status:** Exists (Basic HTML)
- **Details:** Uses standard HTML/inline CSS templates within `src/lib/email.ts`. It does not currently use a robust templating engine like React Email or MJML.

### 5. Website ↔ Email Status Terminology Consistency
- **Status:** Needs Alignment
- **Details:** The database uses technical enums (`PENDING_ADVANCE`). The frontend renders this directly as "PENDING_ADVANCE" (replaced underscores with spaces). The email templates use customer-friendly terms ("Order Received", "Order Confirmed").

### 6. WhatsApp CTA Consistency
- **Status:** Exists (Static)
- **Details:** A `WhatsAppButton.tsx` component exists for general inquiries, drawing from `site-config.ts`. It is not dynamically linked to specific order contexts in the customer dashboard.

### 7. WhatsApp Order/Status Notifications
- **Status:** Does Not Exist
- **Details:** There is no integration with Meta/Twilio WhatsApp APIs for programmatic message dispatch parallel to Resend emails.

### 8. Email Order Details with Specific Fields
- **Status:** Exists (Text Only)
- **Details:** The current `email.ts` templates map over `order.items` to display `productName` and `quantity`. It lacks rich media (product images, thumbnails) in the email body.

### 9. Order-related PDF/Document Delivery
- **Status:** Partially Exists (Web Print Only)
- **Details:** An invoice is accessible via `/checkout/invoice?order=...` which uses `window.print()` functionality. PDFKit is configured in `next.config.ts`, but automated PDF attachment delivery via email is not currently implemented.

### 10. Financial Documents
- **Status:** Partially Exists
- **Details:** Only a unified "Invoice" exists. Differentiated documents like "Advance Due Notice" or "Advance Payment Receipt" are not implemented.

### 11. Operational Documents
- **Status:** Does Not Exist
- **Details:** No operational PDFs (Processing Update, Dispatch Bill, Delivery Confirmation, Rejection/Cancellation Notices) are generated. Only text emails are sent.

### 12. Customer Profile → Checkout Auto-fill
- **Status:** Exists
- **Details:** The checkout page fetches `/api/user/address` on load and pre-fills the form state with the user's default address.

### 13. Edit Auto-filled Checkout Information
- **Status:** Exists (Snapshot Behavior)
- **Details:** Users can edit the pre-filled form. Upon submission, `checkout.service.ts` saves this data as a JSON object into `Order.shippingAddress`. It does *not* overwrite the user's master profile address, preserving the snapshot of where that specific order was shipped.

### 14. Customer In-App Notification Center
- **Status:** Does Not Exist
- **Details:** No `Notification` model exists in the Prisma schema. All notifications are strictly out-of-band (email).

### 15. Better Order Dashboard
- **Status:** Exists (Very Basic)
- **Details:** `OrdersTable.tsx` fetches all orders via a single `prisma.order.findMany()` call without pagination.

### 16. Order Status Filters
- **Status:** Does Not Exist
- **Details:** The Admin dashboard lacks filtering capabilities by status.

### 17. Order Search
- **Status:** Does Not Exist
- **Details:** No search functionality (by order number, customer name, or phone) exists in the Admin dashboard.

### 18. Order Activity Timeline
- **Status:** Does Not Exist
- **Details:** The database lacks an `OrderEvent` or `OrderHistory` table. Status transitions overwrite the current `status` field without an audit trail of *when* or *who* changed it.

### 19. Payment / Advance / Balance Visibility
- **Status:** Exists
- **Details:** The Prisma schema natively supports `total`, `advancePaid`, and `balanceDue`. 
- **Arbitrary Advance Amounts:** YES. `OrderService.updateOrderStatus` accepts an arbitrary `advancePaidAmount` parameter and dynamically calculates `balanceDue = total - advancePaidAmount`.
- **UI Discrepancy:** The Checkout frontend *hardcodes* a visual warning: "Advance Required (20%)". The 20% rule is not enforced by the backend database.

### 20. Invoice/Document Management
- **Status:** Does Not Exist
- **Details:** Admins can only view the web-based invoice. There is no portal for uploading external documents or managing multiple attachments per order.

### 21. Admin Order Notes
- **Status:** Does Not Exist
- **Details:** The Prisma `Order` model does not contain a `notes` or `adminNotes` field.

### 22. Operational Alerts
- **Status:** Does Not Exist
- **Details:** No automated alerts exist for SLAs (e.g., "Order pending for > 48 hours").

---

## PART 2 — REGRESSION RISKS & CRITICAL PATHS

The following existing architectures must be protected during upgrades:

1. **Email Diagnostic Path (0003 Implementation):**
   - **Risk:** Modifying `OrderService.updateOrderStatus` could break the recently stabilized email dispatch triggers.
   - **Mitigation:** Retain the fire-and-forget `sendOrderStatusUpdateEmail` invocation block precisely as implemented.

2. **PDFKit Configuration:**
   - **Risk:** Modifying `next.config.ts` or introducing new PDF libraries could resurface the `ENOENT` Vercel deployment bugs.
   - **Mitigation:** If new PDFs are added, they must utilize the existing `pdfkit` architecture with explicit `outputFileTracingIncludes` support.

3. **Checkout Shipping Address Snapshotting:**
   - **Risk:** Changing how customer profiles sync to checkout could break the immutable `shippingAddress` JSON block stored on the `Order` model.
   - **Mitigation:** Ensure profile updates remain decoupled from historical order records.

4. **Advance Payment Calculation:**
   - **Risk:** Modifying the order confirmation flow could break the `balanceDue` arithmetic in `OrderService.updateOrderStatus`.
   - **Mitigation:** Strictly maintain the equation: `balanceDue = total - advancePaidAmount`.

---

## PART 3 — DEPENDENCIES & IMPLEMENTATION ORDER

Upgrades must be executed sequentially to prevent architectural collapse:

**Phase 1: Foundation (Database & Admin)**
1. Add `notes` field to Prisma `Order` model.
2. Implement Order Search, Pagination, and Status Filters in `OrdersTable.tsx`.
3. Create `OrderEvent` table to support the Order Activity Timeline audit trail.

**Phase 2: Documents & Communication**
4. Standardize PDFKit generation for multiple document types (Financial & Operational).
5. Upgrade `email.ts` to include rich templates (product images) and attach the new PDFs.

**Phase 3: Customer Experience (CX)**
6. Build a dedicated standalone `/track` page using the existing capability token logic.
7. Integrate WhatsApp APIs (if approved) alongside the email triggers.
8. Align website UI terminology with email terminology.

---

## PART 4 — PRE-FLIGHT BACKUP & ROLLBACK STRATEGY

1. **Database:** Execute a full logical dump (`pg_dump` or equivalent depending on provider) of the production database prior to migrating any new schema changes (e.g., `OrderEvent`, `notes`).
2. **Rollback Plan:** 
   - Code: `git revert` to the pre-upgrade commit hash.
   - DB: Revert schema utilizing `prisma migrate resolve --rolled-back` and restore data from the logical dump if destructive changes occur.
3. **Validation:** Ensure the `tests/status-email.test.ts` suite passes continuously.

---

## PART 5 — FINAL RECOMMENDATION

The system possesses a strong foundational schema capable of handling advanced payment structures and tracking logic, but it suffers from an under-developed Admin interface and lacks historical audit trails.

**Recommendation:** Proceed with the upgrade in strict phases as outlined in Part 3. Do not attempt to upgrade CX features (like advanced tracking or WhatsApp) until the Admin Dashboard has been stabilized with pagination, search, and a concrete Activity Timeline model.

*No code changes have been made during this audit.*
