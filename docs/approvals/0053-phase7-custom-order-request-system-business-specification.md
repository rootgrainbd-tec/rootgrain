ROOTGRAIN — PHASE 7
CUSTOM ORDER REQUEST SYSTEM
BUSINESS-FLOW RECONCILIATION SPECIFICATION
==============================================================

## 1. Business Scenario

A customer may contact RootGrain through offline channels (phone, in-person) or submit a request directly via the website. A request can contain multiple distinct bespoke items (e.g., 1 Door, 2 Chairs), each with its own specifications and negotiated price. 
The system must gracefully support both Customer-driven web requests (requiring formal quotation and acceptance) and Admin-driven requests where commercial terms have already been agreed upon offline.

## 2. Phase 7 Roadmap Position

- **Phase 6**: CLOSED. No QC, Dispatch, Refund, or Accounting implementations.
- **Phase 7**: CURRENT. Focuses strictly on capturing custom requests, managing quotes, and bridging to the existing Phase 6 MTO Order lifecycle.
- **Phase 8**: FUTURE. (Unified Admin Order Management).
- **Phase 9**: FUTURE. (Documents & Communication).

## 3. Customer Identity

A customer's Mobile Number is **REQUIRED**. Email is **OPTIONAL**. 
The generic authentication system (NextAuth `User` model) strictly requires unique emails. To avoid corrupting the existing generic auth or building a redundant identity system, Phase 7 will **NOT** create a `User` account for mobile-only customers. 

## 4. Mobile-first Requirement

Mobile-only customers will be supported via inline identity directly on the `CustomRequest` (mirroring how Guest Orders operate).
There is NO unique constraint imposed on the mobile number, allowing a customer to submit multiple requests over time without colliding. Admins will locate returning customers by searching phone numbers across existing `CustomRequest` and `Order` tables.

## 5. Customer-created Flow

1. Customer submits the request online (Mobile required, Email optional).
2. `creationChannel` = `CUSTOMER_ONLINE`.
3. State = `SUBMITTED`.
4. Admin reviews, specifies `QUOTE_READY`.
5. Customer accepts the quote (if email is absent, SMS/WhatsApp notification would be required outside the system, or they can check status via mobile OTP in the future).

## 6. Admin-created Flow

1. Admin clicks "Create Custom Request".
2. `creationChannel` = `ADMIN_OFFLINE`.
3. Admin enters the customer's Name and Mobile (Email optional).
4. Admin defines the items, specifications, and agreed prices.
5. If the customer has already agreed, Admin can immediately initiate the **Conversion** to an Order. If not agreed, Admin saves it as `QUOTE_READY` to await Customer Acceptance.

## 7. Multiple Custom Items

A Request is not a single global entity. It is a container for multiple bespoke items.
Phase 7 requires a dedicated `CustomRequestItem` model.

## 8. Item Data Model

```prisma
model CustomRequestItem {
  id               String   @id @default(cuid())
  customRequestId  String
  
  // Specification
  name             String
  quantity         Int      @default(1)
  designSpecs      String?  // Dimensions, Wood, Finish, Description
  referenceImages  Json?    // Array of secure URLs
  
  // Pricing
  agreedUnitPrice  Int?

  customRequest    CustomRequest @relation(fields: [customRequestId], references: [id], onDelete: Cascade)
}
```

## 9. Agreed Pricing

Pricing is calculated exactly as the existing `checkout.service.ts` logic dictates:
- `CustomRequestItem.agreedUnitPrice` × `quantity` = Item Total
- Sum of Item Totals = `subtotal`
- `subtotal` + `deliveryCharge` = `total`
- `requiredAdvance` is manually specified by Admin (defaulting to 50% of total if not specified).

## 10. Estimated Completion

`estimatedCompletionDate` will be stored on the `CustomRequest`. Upon conversion, it will map to the existing `Order.estimatedManufacturingDays` or a new `estimatedCompletionDate` field on the Order, representing the production timeline, **NOT** the dispatch/delivery date.

## 11. Request Lifecycle

```prisma
enum CustomRequestStatus {
  SUBMITTED
  UNDER_REVIEW
  QUOTE_READY
  CUSTOMER_DECLINED
  CONVERTED
  CANCELLED
}

enum CustomRequestChannel {
  CUSTOMER_ONLINE
  ADMIN_OFFLINE
}
```

## 12. Request → Order Lifecycle

Custom Request is an independent lifecycle. Conversion acts as the strict boundary.
Once converted, the `CustomRequest` is frozen. The generated `Order` and `OrderItem`s become the authoritative financial and fulfillment records. 
Changes to catalog Products or the `CustomRequest` after conversion have **zero** impact on the Order.

## 13. Customer Workflow

1. Opens Custom Order form.
2. Provides Name and Mobile Number.
3. Adds one or more custom items (Name, Specs, Quantity, optional Image).
4. Submits request (Idempotency prevents double submission).
5. Receives Guest Token/Link to track request and eventually Accept/Decline the quote.

## 14. Admin Workflow

1. Opens "Custom Requests" Admin view.
2. Creates Request on behalf of a customer (adding Name, Mobile, and Items).
3. Adds `agreedUnitPrice` for items, `deliveryCharge`, and `requiredAdvance`.
4. Triggers server-side **Convert to Order** if terms were agreed offline.

## 15. Offline Agreement

The system supports offline agreements natively. If `creationChannel == ADMIN_OFFLINE`, the Admin is permitted to bypass `QUOTE_READY` and Customer Acceptance by executing the atomic conversion themselves, representing the offline verbal agreement.

## 16. Financial Integration

The resulting `Order` maps seamlessly into Phase 5/6:
- `isMtoOrder = true`
- `status = PENDING_ADVANCE`
- Financial values snapshot directly from the Custom Request.
No duplicate payment ledgers or balances are created.

## 17. Snapshot Rules

The resulting `OrderItem` must snapshot the custom specification.
**Database Impact**: Currently, `OrderItem.productId` is a strictly required field. To support bespoke items that do not exist in the catalog, Phase 7 MUST either:
A. Alter `OrderItem.productId` to be optional (`String?`).
B. Create a generic "Bespoke Placeholder" `Product` record to fulfill the foreign key constraint.
*(Recommendation: Alter to `String?` for cleaner historical data)*.

## 18. Audit

A dedicated `CustomRequestEvent` model (mirroring `OrderEvent`) is required.
It will track: `SUBMITTED`, `QUOTE_READY`, `CUSTOMER_ACCEPTED` / `ADMIN_ACCEPTED_OFFLINE`, `CONVERTED`.
The actor will record whether the action was taken by a Customer (Guest) or an Admin.

## 19. Idempotency

Existing `IdempotencyKey` engine will secure all writes (Submission, Quote Creation, Conversion). 
A concurrent Admin conversion and Customer conversion of the same request will hit a `FOR UPDATE` lock; the loser will safely abort or receive the cached success response.

## 20. Security (Customer Access)

Mobile-only customers will receive a cryptographically secure `guestTokenHash` (similar to Guest Orders). Accessing or modifying a request requires presenting the raw token. Mobile number alone is NEVER used as a secret credential.

## 21. File / Reference Image Handling

Sanity CMS is unsuitable for customer-facing uploads. Phase 7 will require provisioning a Vercel Blob, AWS S3, or similar bucket for secure, size-limited (e.g., 5MB) image storage attached to `CustomRequestItem`s.

## 22. Database Impact

- Add `CustomRequest` and `CustomRequestItem` models.
- Add `CustomRequestEvent` model.
- Add `CustomRequestStatus` and `CustomRequestChannel` enums.
- Modify `OrderItem.productId` to `String?` (or enforce placeholder product usage).
- Add `customerName`, `customerPhone`, `customerEmail` directly to `CustomRequest`.

## 23. Standard Order Compatibility

Orders generated from Custom Requests are standard `Order` records flagged as `isMtoOrder = true`. They are 100% compatible with existing dashboards and payment flows.

## 24. Phase 8 Boundary

Admin UI for Phase 7 is restricted to managing the Custom Request lifecycle and initiating conversion. Broader unified order dashboards are strictly deferred to Phase 8.

## 25. Phase 9 Boundary

No document generation (PDF invoices, dynamic contracts) will be implemented as part of the Phase 7 quoting process.

## 26. Test Strategy

- Customer web submission vs Admin offline creation.
- Quote locking and snapshotting.
- Concurrent conversion attempts yielding exactly one Order.
- Guest token verification failures.

## 27. Risks

- Managing orphaned images in the object storage if requests are abandoned mid-form.

## 28. Open Business Decisions

- How will mobile-only customers be notified when a Quote is ready? (SMS integration is not currently in the stack; Admin may need to manually call them).

## 29. Acceptance Criteria

- [ ] Admin can create a Custom Request with multiple items and immediately convert to Order based on offline agreement.
- [ ] Customer can submit a Custom Request with multiple items via the web.
- [ ] Mobile is required, email is optional; no dummy `User` accounts are created.
- [ ] Conversion atomically generates a standard Order and snapshots item prices into `OrderItem`.
- [ ] Existing PaymentService accepts payments against the converted Order.

## 30. Explicit Out-of-Scope

- SMS Gateway Integration.
- Quote versioning/revisions.
- QC, Dispatch, Delivery features.

==============================================================
STATUS: AWAITING APPROVAL
==============================================================
