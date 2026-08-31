ROOTGRAIN — PHASE 7
CUSTOM ORDER REQUEST SYSTEM
REVISION 1 — BUSINESS FLOW + ARCHITECTURE FREEZE
==============================================================

## 1. Business Scenario

A customer may contact RootGrain through offline channels (phone, in-person) or submit a request directly via the website. A custom request can contain multiple bespoke items (e.g., 1 Door, 2 Chairs), each with its own specifications and negotiated unit price. 

The system MUST gracefully support both:
1. Customer-driven web requests (requiring formal quotation).
2. Admin-driven requests where the customer and RootGrain have already negotiated and agreed on terms offline.

## 2. Roadmap Position

- **Phase 6**: CLOSED. No QC, Dispatch, Refund, or Accounting implementations.
- **Phase 7**: CURRENT. Focuses strictly on capturing Custom Requests, managing quotes, and bridging to the existing Phase 6 MTO Order lifecycle.
- **Phase 8**: FUTURE. (Unified Admin Order Management).
- **Phase 9**: FUTURE. (Documents & Communication).

## 3. Customer Identity

A customer's Mobile Number is **REQUIRED**. Email is **OPTIONAL**. 
The generic authentication system (NextAuth `User` model) strictly requires unique emails. To avoid breaking the existing generic auth or building a redundant identity system, Phase 7 will **NOT** create a `User` account for mobile-only customers. 

## 4. Mobile-first Model

Mobile-only customers will be supported via inline identity directly on the `CustomRequest`.
There is NO unique constraint imposed on the mobile number in `CustomRequest`. A single customer or shared phone can create multiple requests. Admins will locate returning customers by searching phone numbers across existing `CustomRequest` and `Order` tables without performing arbitrary data merges.

## 5. Creation Channels

CustomRequest MUST support exactly two creation channels (`CustomRequestChannel`):

A. **CUSTOMER_ONLINE**: Customer creates the request through the website.
B. **ADMIN_OFFLINE**: Admin creates the request on behalf of a customer after an offline communication.

## 6. Customer Online Flow

1. **Submit**: Customer submits online (`CUSTOMER_ONLINE`). Mobile required, email optional.
2. **State**: `SUBMITTED`.
3. **Review**: Admin reviews, adds pricing, and moves to `QUOTE_READY`.
4. **Accept**: Customer reviews the quote and formally accepts it, triggering atomic conversion to `CONVERTED` and generating the Order. (Alternatively, the customer declines, transitioning to `CUSTOMER_DECLINED`).

## 7. Admin Offline Flow

1. **Create**: Admin clicks "Create Custom Request" on behalf of the customer (`ADMIN_OFFLINE`), providing name, mobile, items, specs, and agreed prices.
2. **Offline Agreement Validated**: Because the commercial terms have already been confirmed verbally/offline, the Admin is authorized to immediately initiate conversion.
3. **Convert**: Admin triggers the server-side Convert action. The system transitions the request directly to `CONVERTED` and atomically generates the Order. 
*(No unnecessary secondary customer quotation/acceptance loop is forced on an already-agreed offline order).*

## 8. Multiple Custom Items

A Request is a container for multiple bespoke items. DO NOT model `CustomRequest` as a single product. A dedicated `CustomRequestItem` model is required.

## 9. Item Data Model

```prisma
model CustomRequestItem {
  id               String   @id @default(cuid())
  customRequestId  String
  
  // Specification
  name             String
  quantity         Int      @default(1)
  designSpecs      String?  
  dimensions       String?
  material         String?
  finish           String?
  notes            String?
  referenceImages  Json?    // Array of secure URLs
  
  // Pricing
  agreedUnitPrice  Int?

  customRequest    CustomRequest @relation(fields: [customRequestId], references: [id], onDelete: Cascade)
}
```

## 10. Pricing Model

Pricing calculations identically mirror existing Order semantics:
- `CustomRequestItem.agreedUnitPrice` × `quantity` = Item Total
- Sum of all Item Totals = `CustomRequest.subtotal`
- `CustomRequest.subtotal` + `deliveryCharge` = `CustomRequest.total`
- `balanceDue` = `CustomRequest.total`

## 11. Required Advance

In the existing standard MTO lifecycle, `requiredAdvance` defaults to 50% (`Math.floor(total * 0.5)`). 
For Custom Orders, Admin MUST be able to explicitly specify or override `requiredAdvance` during quotation/creation. 
Server-side validation enforces: `requiredAdvance >= 0` and `requiredAdvance <= total`.

## 12. Estimated Completion

`Order` currently tracks `estimatedManufacturingDays` (a duration). A custom agreement often guarantees a specific date (e.g., "December 15th"). 
**Recommendation**: Do NOT overload the duration field. A new explicit `estimatedCompletionDate DateTime?` field should be added to both `CustomRequest` and `Order` to preserve the exact agreed calendar date.

## 13. Request State Machine

```prisma
enum CustomRequestStatus {
  SUBMITTED
  UNDER_REVIEW
  QUOTE_READY
  CUSTOMER_DECLINED
  CONVERTED
  CANCELLED
}
```

## 14. Conversion

Conversion is the strict transactional boundary. Before conversion, `CustomRequest` is authoritative for specifications and quotation. After conversion, the `Order` becomes the authoritative financial and fulfillment record.

**Atomic Conversion Transaction (`FOR UPDATE`)**:
1. Claim `IdempotencyKey`.
2. `SELECT CustomRequest FOR UPDATE`.
3. Verify eligible status (`QUOTE_READY` or offline authorization) and `orderId IS NULL`.
4. Create `Order` (snapshotting financial terms, `isMtoOrder = true`, `status = PENDING_ADVANCE`).
5. Create `OrderItem` snapshots.
6. Set `CustomRequest.status = CONVERTED` and `CustomRequest.orderId = Order.id`.
7. Write `CustomRequestEvent` and `OrderEvent`.
8. Complete `IdempotencyKey`.

## 15. Order Snapshot

The generated `OrderItem` natively stores `productName`, `quantity`, `unitPrice`, and `total`. It must reliably preserve the bespoke item details (e.g., appending design specs/dimensions to `productName` or mapping to a `notes` field) without duplicating unneeded fields. Post-conversion changes to catalog Products do not affect these snapshots.

## 16. Product ID Strategy

**Finding**: `OrderItem.productId` is currently required. However, the repository UI/analytics predominantly relies on the snapped `productName` rather than joining the Product relation directly. 
**Recommendation**: Alter `OrderItem.productId` to `String?` (nullable). This is the cleanest architectural approach for Bespoke items, avoiding the contamination of the Product catalog with fake "Placeholder" entries.

## 17. Audit

`OrderEvent` cannot represent pre-Order events. A dedicated append-only `CustomRequestEvent` model is required.
Events: `CUSTOM_REQUEST_SUBMITTED`, `QUOTE_READY`, `CUSTOMER_DECLINED`, `ADMIN_ACCEPTED_OFFLINE`, `CUSTOMER_ACCEPTED`, `CONVERTED`.
The system will record the authenticated `actor` (Admin Identity or Guest Token) for each event.

## 18. Idempotency

The existing `IdempotencyKey` engine will secure all writes (Submission, Quote Creation, Conversion). 
Two concurrent Admin/Customer conversion attempts will trigger a `FOR UPDATE` lock. The second request will yield an `IdempotencyClaimConflictSignal` or recover the completed response, guaranteeing exactly one Order is generated.

## 19. Guest Security

Mobile number is NOT a secret. If a customer has no email/account, the system will use a secure guest token architecture (similar to Guest Orders). A `guestTokenHash` is stored on the `CustomRequest`. Customers cannot access requests by merely guessing a mobile number or ID.

## 20. File / Image Handling

Sanity CMS is unsuitable for customer-facing uploads. Phase 7 will require provisioning a Vercel Blob, AWS S3, or similar bucket for secure, size-limited (e.g., 5MB), and type-restricted image storage attached to `CustomRequestItem`s. Orphan cleanup strategies must be defined. (Implementation deferred).

## 21. Notifications

Email is optional. If the customer does not provide an email, they cannot receive automated Quote links via standard NextAuth/Nodemailer flows. 
Since SMS/WhatsApp gateways are out-of-scope for Phase 7, Admin manual communication (calling the customer) is the designated fallback for notifying a mobile-only customer that a quote is ready.

## 22. Payment Integration

After conversion, the Custom Order enters the system as a standard RootGrain Order (`isMtoOrder = true`). It fully utilizes the existing PaymentService, PaymentRecord, and Payment Ledger architecture. No duplicate payment systems will be introduced.

## 23. Standard Order Compatibility

Orders generated from Custom Requests remain 100% compatible with existing dashboards, logistics logic, and payment workflows.

## 24. Phase 8 Boundary

Admin UI for Phase 7 is restricted to managing the Custom Request lifecycle and initiating conversion. Broader Unified Order Dashboards are deferred to Phase 8.

## 25. Phase 9 Boundary

No dynamic document generation (PDF invoices, contracts) will be built into the Phase 7 quoting process.

## 26. Database Impact

- **Add Models**: `CustomRequest`, `CustomRequestItem`, `CustomRequestEvent`.
- **Add Enums**: `CustomRequestStatus`, `CustomRequestChannel`.
- **Modify**: Alter `OrderItem.productId` to `String?`. Add `estimatedCompletionDate DateTime?` to `Order`.
- **Note**: No migration to be created at this time.

## 27. Test Strategy

- **Customer Online**: Mobile required, email optional, multi-item, quote acceptance yields 1 Order.
- **Admin Offline**: Admin creates request for mobile-only customer, prices agreed, direct conversion yields 1 Order.
- **Concurrency**: Concurrent acceptance/conversion yields exactly 1 Order via Idempotency.
- **Financial**: Subtotal reconciliation, Delivery charge, and Required Advance validation.
- **Snapshot**: Catalog product changes do not affect converted Orders.
- **Security**: Mobile number alone cannot authenticate; guest tokens strictly isolated.

## 28. Risks

- Managing orphaned images in object storage if requests are abandoned mid-form.
- Operational friction when communicating quotes to email-less customers without an SMS gateway.

## 29. Open Business Decisions

- None. All major architectural decisions (Offline conversions, OrderItem.productId strategy, Identity constraints) have been resolved via repository audit.

## 30. Acceptance Criteria

- [ ] System supports `CUSTOMER_ONLINE` and `ADMIN_OFFLINE` creation channels.
- [ ] Customers can exist with just a Mobile Number; no dummy `User` accounts are created.
- [ ] A single request supports multiple `CustomRequestItem`s with discrete prices.
- [ ] Admin can bypass web quotation for offline agreements and convert directly to Order.
- [ ] Conversion atomically generates a standard Order and snapshots item prices.
- [ ] Concurrent conversions are blocked via strict Idempotency and row-level locking.
- [ ] Converted Orders are fully compatible with existing PaymentService flows.

## 31. Explicit Out-of-Scope

- Phase 6 modifications (QC, Final Invoice, Dispatch, Delivery).
- SMS / WhatsApp Gateway Integration.
- Quote versioning/revisions.
- Phase 8 Admin Unified Order Management.

==============================================================
STATUS: AWAITING APPROVAL
==============================================================
