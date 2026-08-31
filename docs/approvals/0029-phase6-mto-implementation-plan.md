# 0029 Phase 6: MTO Implementation Plan and Approval Directive

**Revision:** 3
**Status:** APPROVED

## 1. Objective and Phase Identity
Implement a dedicated MTO (Made-to-Order) ordering architecture for RootGrain (Phase 6). This architecture establishes a separate "Direct Buy" pipeline for MTO products, strictly isolated from the normal Available Product cart flow. The Phase 5 Payment Ledger is a frozen dependency and will be strictly reused to manage all financial settlements without duplication.

## 2. Locked MTO Order Flow
MTO products **CANNOT** be added to the normal cart and **CANNOT** be mixed with Available Products. Normal checkout remains unchanged. 
MTO Flow: `Direct Buy → MTO Checkout → Order Created → Admin Review → Admin Confirmation → Invoice → Advance Payment → Production Eligibility → Admin Confirm Production → Production → Quality Check → Dispatch → Delivery → Operational Completion`.

## 3. Order Immutability (Locking Rules)
Upon MTO Order creation, the following are permanently **LOCKED**:
- **Quantity**: Customer selects during checkout. Cannot be changed. 
- **Product & Configuration**: Cannot be changed. 
- **Unit Price**: Catalog price is snapshotted.
- **Shipping Charge**: Calculated at checkout and locked. Not recalculated after Address Correction.
- **Coupon Discount**: Snaphotted at creation using the existing Coupon Engine.
*Note: Any changes to these core attributes require creating a completely NEW MTO Order.*

## 4. Final MTO Order Total & Coupon Integration
The MTO Checkout uses the **EXISTING** RootGrain coupon system. 
- **Formula**: `Product Subtotal + Shipping Charge - Coupon Discount = Final MTO Order Total`.
- **Integrity**: Coupons apply before Order creation and are snapshotted. Existing order pricing will not silently change if coupon configurations change later. Advance calculation always uses the Final MTO Order Total.

## 5. Lead Time & Manufacturing Estimate
- **Calculation**: 1 unit = 30 calendar days. Each additional unit = +10 calendar days. 
- **Configuration**: These values must be configurable per product. The calculated lead time is an ESTIMATED MANUFACTURING TIME ONLY, excluding shipping.
- **Admin Final Override**: At confirmation, an Admin can override the calculated estimate.
- **Production Estimate Lock**: 
  - *Before `ProductionState = IN_PROGRESS`*: Admin may change the estimate. If changed, audit the change, revise the invoice, and preserve old invoice history.
  - *After `ProductionState = IN_PROGRESS`*: The Final Manufacturing Estimate is **LOCKED**. No further change is allowed.

## 6. Advance Policy & Advance Lock
- **Default Advance**: 50% of the Final Order Total.
- **Admin Override**: Admin may negotiate and set the final agreed advance before payment.
- **Advance Lock**: 
  - *Before ANY payment exists*: Admin can change the final Required Advance.
  - *After ANY payment is recorded*: Required Advance is **LOCKED**. Admin cannot increase or decrease it.

## 7. Payment Validation & Recording
Payments rely exclusively on the frozen Phase 5 Payment Ledger. Deletion of payments is strictly **PROHIBITED**. Editing is allowed and thoroughly audited.
**Strict Server-Side Validation required for recording payments:**
- **Payment Amount**: MUST be REQUIRED, strictly > 0, and MUST NOT exceed the current remaining balance.
- **Payment Date**: MUST be REQUIRED. Allowed: Past date, Today. Prohibited: Future date, or Date earlier than the Order Created Date.

## 8. Payment Deadline & Expiry Rules
- **3-Day Deadline**: A default 3-day payment deadline begins upon Admin Order Confirmation.
- **0-Payment Auto-Expiry**: If `Payment = 0` AND Required Advance is unmet AND the 3-day deadline expires → Order automatically becomes **EXPIRED**.
- **Partial Payment Exceptions**: If a partial payment exists at the deadline but is less than the Required Advance, automatic expiry is **SUPPRESSED**. Admin decision is required.
- **Expired Rules**: Once EXPIRED, the order is permanently closed. There is NO reactivation flow. The invoice becomes `VOID / CANCELLED`, though historical invoice data is preserved. Customers must initiate a NEW MTO Direct Buy.

## 9. Delivery Address & Address Correction
- Delivery Address is locked at creation.
- **Admin Address Correction**: Admins can correct addresses (even if production is `IN_PROGRESS`). 
- **Effective Shipping Address**: The latest corrected address becomes the **EFFECTIVE DELIVERY ADDRESS**. Dispatch must use this latest address. The original address is preserved in history.
- **No Timeline Reset**: Address correction does **NOT** reset the payment deadline, change estimates, recalculate shipping, or roll back production.
- **Invoice Impact**: Triggers a revised invoice according to the existing engine, preserving historical invoices.

## 10. Notes & Permissions
- **Customer Note**: MTO checkout allows ONE Customer Note. It is **IMMUTABLE** after Order Creation. Customer, Admin, and Production can VIEW it. No one can edit or delete it. It is NOT included in the invoice and is NOT an automatic production instruction.
- **Admin Internal Notes**: Multiple allowed. Admin can CRUD. Production Team can view but cannot CRUD. Customer cannot view. Edits/deletes are audited. Admin uses these to document operational decisions based on the Customer Note.

## 11. Production Eligibility & State Transitions
- **Eligibility**: Achieved when actual Payment Ledger records show `Paid >= Required Advance`.
- **Confirmation**: Does NOT start automatically. Admin must click `[CONFIRM PRODUCTION]`.
  - Atomic transition: `ProductionState = IN_PROGRESS` & `TrackingState = IN_PRODUCTION`.
- **Payment Correction Safeties**: Once `IN_PROGRESS`, any payment corrections/edits do NOT revoke eligibility or roll back production.
- **Completion**: `IN_PROGRESS → COMPLETE` & `IN_PRODUCTION → QUALITY_CHECK`. (Atomic).
- **Dispatch**: `QUALITY_CHECK → READY_FOR_DISPATCH → DISPATCHED`.
- **Delivery**: `DISPATCHED → DELIVERED`.

## 12. Operational Completion vs Financial Settlement
- **Delivery without Settlement**: Admin may mark an order `DELIVERED` even if `balanceDue > 0`. Operational completion and financial settlement are completely independent.
- **Post-Delivery Payments**: If balance remains after delivery, Admins can record MULTIPLE subsequent payments through the existing Phase 5 Ledger. No one-time-only restriction exists. If final payment at delivery is 0, delivery is still allowed without creating a 0-value payment record.

## 13. Proposed Data Model
Based on validation of the current `prisma/schema.prisma`:
- **Order Model**: Perfectly supports `requiredAdvance`, `advancePaid`, `balanceDue`, `notes` (used for the immutable Customer Note), `ProductionState`, and `TrackingState`. 
  - *New Fields Required*: `isMtoOrder Boolean @default(false)`, `advanceDeadline DateTime?`, `estimatedManufacturingDays Int?`.
- **Product Model**: Lacks MTO configuration.
  - *New Fields Required*: `isMto Boolean @default(false)`, `baseLeadTimeDays Int @default(30)`, `additionalUnitLeadTimeDays Int @default(10)`.
- **AdminInternalNote Model**: *New Model Required*.
  - `id String @id`
  - `orderId String` 
  - `content String`
  - `createdBy String`
  - `createdAt DateTime @default(now())`
  - `updatedAt DateTime @updatedAt`

## 14. RBAC & Auditing
- **RBAC**: Existing RootGrain RBAC is used. Server-side `ADMIN` authorization is required for Confirmation, Advance setting, Estimate override, Deadline extension, Payment recording/editing, Address correction, Production transitions, and Internal Notes.
- **Auditing**: Explicitly audit: Advance changes, Estimate changes, Deadline extensions, Address correction, Payment edits, Internal Note CRUD, Production/Tracking state transitions, and Invoice revisions/voiding.

## 15. Test Plan
- **MTO**: Direct Buy only, Cannot enter normal cart, Cannot mix with Available Products, Quantity selection, Quantity lock, Product lock, Configuration lock, Price lock, Shipping lock, Coupon integration, Lead time formula, Admin estimate override, Estimate locking.
- **Advance**: Default 50%, Admin override, Advance lock after first payment, Production eligibility.
- **Expiry**: 0-payment auto-expiry, Partial-payment expiry suppression, No reactivation, Void invoice after expiry.
- **Address**: Address lock, Address correction, Audit history, Effective corrected shipping address, Invoice revision, No timeline reset, No shipping recalculation.
- **Notes**: Customer Note immutable, Customer Note visibility, Admin Internal Notes CRUD, Production view permissions, Audit.
- **Payments**: Payment amount > 0, Payment <= remaining balance, Payment date required, No future date, No date before Order Created, Payment edit, Payment delete prohibited, Delivery with outstanding balance, Multiple post-delivery payments, Zero-value final payment not recorded.
- **State**: Production eligibility, Confirm Production atomic transition, Production completion atomic transition, Quality Check, Dispatch, Delivery, Operational completion independent of settlement.
- **Regression**: Existing Available Product cart, Existing Available Product checkout, Existing normal order flow, Existing Phase 5 Payment Ledger, Existing Coupon Engine, Existing Invoice Engine, Existing RBAC.

## 16. Acceptance Criteria
1. MTO cannot enter normal cart.
2. MTO uses Direct Buy.
3. Quantity is locked after order creation.
4. Product/configuration are locked.
5. Unit price is locked.
6. Shipping charge is locked.
7. Coupon uses existing engine.
8. Default advance is 50%.
9. Admin can negotiate advance before payment.
10. Advance locks after first payment.
11. Manufacturing estimate is configurable.
12. Admin can override estimate before production.
13. Estimate locks at IN_PROGRESS.
14. 3-day deadline applies after confirmation.
15. 0-payment unmet advance auto-expires.
16. Partial payment suppresses automatic expiry.
17. Expired orders cannot reactivate.
18. Expired invoice becomes VOID/CANCELLED.
19. Address correction is auditable.
20. Latest corrected address is used for dispatch.
21. Address correction does not reset timelines.
22. Customer Note is immutable.
23. Internal Notes are Admin-managed and Production-viewable.
24. Payment deletion is impossible.
25. Payment editing is audited.
26. Production requires actual required advance.
27. Payment corrections do not rollback production.
28. Delivery can occur with outstanding balance.
29. Multiple post-delivery payments are supported.
30. Operational completion does not require full financial settlement.
31. Normal Available Product checkout remains unaffected.

---
**STATUS:** AWAITING APPROVAL
**IMPLEMENTATION:** BLOCKED
