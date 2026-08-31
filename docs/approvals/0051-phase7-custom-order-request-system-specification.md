ROOTGRAIN — PHASE 7
CUSTOM ORDER REQUEST SYSTEM
APPROVAL SPECIFICATION
==============================================================

## 1. Executive Summary

This document specifies the architectural foundation for Phase 7: Custom Order Request System. Following a read-only repository audit, this specification defines the boundary between MTO (Phase 6) and Custom Requests (Phase 7), defines the `CustomRequest` lifecycle and quotation architecture, and outlines the exact transactional boundaries required to securely convert an accepted quotation into an actionable Order within the existing financial and state machine constraints.

## 2. Roadmap Position

- **Phase 6 (MTO Engine)**: CLOSED.
- **Phase 7 (Custom Order Request System)**: CURRENT.
- **Phase 8 (Unified Admin Order Management)**: FUTURE.
- **Phase 9 (Documents & Communication)**: FUTURE.

Phase 6 modifications are strictly frozen unless resolving blocking defects. All QC, dispatch, and final accounting features deferred in Phase 6 will remain deferred until their respective future phases. Phase 7 focuses strictly on capturing, quoting, and converting bespoke customer requests.

## 3. Existing Architecture

The RootGrain platform operates on a strictly separated state machine:
- `Order.status`: Financial tracking (`PENDING_ADVANCE`, `CONFIRMED`, `PROCESSING`, `DISPATCHED`, `DELIVERED`).
- `Order.productionState`: Manufacturing progress (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETE`).
- `Order.trackingState`: Physical location (`PENDING_PRODUCTION`, `IN_PRODUCTION`, `QUALITY_CHECK`, etc.).

Currently, orders are created immediately upon customer checkout. Custom requests require quotation *before* an order is created.

## 4. Inquiry Audit Findings

The `Inquiry` model exists in the Prisma schema and is actively used as a simple contact form.
- **Role**: Lead generation and contact purposes.
- **Usage**: A customer clicking "Inquire / Custom Order" in `InquiryDialog.tsx` submits a message, phone number, and optional `productId`.
- **Admin**: Admins view inquiries in `InquiryTable.tsx` and can update their string status.
- **Conclusion**: `Inquiry` is an active legacy component serving contact purposes. It does **not** possess the relational or state-tracking capabilities required for formal Custom Order quotation and conversion. It must be preserved for contact flow and NOT mutated into the `CustomRequest` engine.

## 5. CustomRequest Audit Findings

- **Status**: Completely absent.
- **Findings**: The repository contains no models, services, APIs, or UI for `CustomRequest`. A new architectural component must be designed from scratch.

## 6. MTO vs Custom Boundary

| Capability | Phase 6: MTO | Phase 7: Custom Request |
|------------|--------------|-------------------------|
| Catalog Product | Yes | Optional |
| Fixed Catalog Price | Yes | No (Manual Quote Required) |
| Bespoke Dimensions | No | Yes |
| Bespoke Wood/Design | No | Yes |
| Customer Journey | Standard Checkout | Request → Quote → Accept → Checkout |
| Manufacturing | Yes | Yes (Post-Conversion) |

## 7. Business Lifecycle

1. **Submit**: Customer submits a Custom Request with descriptions, dimensions, and reference images.
2. **Review**: Admin reviews the request requirements.
3. **Quotation**: Admin issues a formal quote (Price, Required Advance, Terms).
4. **Acceptance**: Customer reviews the quote and accepts (or declines).
5. **Conversion**: The accepted quote is atomically converted into a formal `Order`.
6. **Fulfillment**: The Order enters the standard Phase 6 MTO manufacturing and Phase 5 financial lifecycles.

## 8. Data Model

```prisma
enum CustomRequestStatus {
  SUBMITTED
  UNDER_REVIEW
  QUOTE_READY
  CUSTOMER_ACCEPTED
  CUSTOMER_DECLINED
  CONVERTED
  CANCELLED
}

model CustomRequest {
  id               String   @id @default(cuid())
  userId           String?  // Optional for Guest
  guestTokenHash   String?  // For Guest tracking
  name             String
  email            String
  phone            String

  // Request Details
  productId        String?  // If based on an existing catalog item
  description      String
  requestedWood    String?
  requestedDims    String?
  quantity         Int      @default(1)
  referenceImages  Json?    // Array of upload URLs

  // Quotation (Populated by Admin)
  quotedPrice      Int?
  requiredAdvance  Int?
  deliveryCharge   Int?
  commercialTerms  String?

  status           CustomRequestStatus @default(SUBMITTED)
  adminNotes       String?
  
  orderId          String?  @unique // Link to resulting Order
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User?    @relation(fields: [userId], references: [id])
  product          Product? @relation(fields: [productId], references: [id])
  order            Order?   @relation(fields: [orderId], references: [id], onDelete: Restrict)

  @@index([userId])
  @@index([guestTokenHash])
  @@index([status])
}
```

## 9. Request State Machine

- **SUBMITTED**: Initial customer submission.
- **UNDER_REVIEW**: Admin is investigating feasibility.
- **QUOTE_READY**: Admin has attached financial terms.
- **CUSTOMER_ACCEPTED**: Customer agrees to terms.
- **CUSTOMER_DECLINED**: Customer rejects terms.
- **CONVERTED**: Request has been converted to a formal `Order`.
- **CANCELLED**: Admin closed the request without quoting.

## 10. Quote Architecture

The Quote is an ephemeral commercial proposal residing directly on the `CustomRequest` record (`quotedPrice`, `requiredAdvance`). 
- It is editable by Admins while the status is `SUBMITTED` or `UNDER_REVIEW`.
- Once transitioned to `QUOTE_READY`, it is proposed to the customer.
- Once `CUSTOMER_ACCEPTED` or `CONVERTED`, the terms are permanently frozen.
- Upon conversion, the quote values map directly into the new `Order` (`total`, `requiredAdvance`) and `OrderItem` (`unitPrice`). No separate quote tables or redundant financial engines are necessary.

## 11. Customer Workflow

- Customer navigates to a new "Custom Order" form (preserving the old `InquiryDialog` for simple contact).
- Authenticated users link via `userId`. Guest users link via `guestTokenHash` (reusing existing checkout security patterns).
- Customer tracks request status.
- When `QUOTE_READY`, customer receives an email and views the commercial terms in a dedicated UI to click "Accept" or "Decline".

## 12. Admin Workflow

- Admin accesses `Admin > Custom Requests` (isolated from standard Order management to respect Phase 8 boundaries).
- Admin reviews details and reference images.
- Admin inputs `quotedPrice`, `requiredAdvance`, and clicks "Send Quote".
- Upon `CUSTOMER_ACCEPTED`, Admin (or system) clicks "Convert to Order".

## 13. CustomRequest → Order Conversion

**Atomic Transaction Boundary**:
1. `BEGIN`
2. `SELECT * FROM "CustomRequest" WHERE id = $1 FOR UPDATE`
3. Assert status is `CUSTOMER_ACCEPTED` and `orderId` is NULL.
4. Insert `Order`:
   - `total` = `quotedPrice` + `deliveryCharge`
   - `subtotal` = `quotedPrice`
   - `requiredAdvance` = `requiredAdvance`
   - `isMtoOrder` = `true`
   - `status` = `PENDING_ADVANCE`
5. Insert `OrderItem` linking to the custom specs.
6. Update `CustomRequest.status = CONVERTED` and `CustomRequest.orderId = Order.id`.
7. Insert `OrderEvent` (`ORDER_CREATED_FROM_CUSTOM_REQUEST`).
8. `COMMIT`

## 14. Payment Integration

- No custom financial ledger will be created.
- The converted `Order` initializes precisely as a standard MTO order waiting for Advance Payment.
- The existing Phase 5 `PaymentService` will handle the required advance validation seamlessly because `Order.requiredAdvance` and `Order.isMtoOrder` will be correctly populated.

## 15. Snapshot / Immutability

- The `CustomRequest` quotation is a draft until accepted.
- Upon conversion, the generated `Order` and `OrderItem` serve as the absolute historical snapshot of the commercial terms.
- Changes to `Product.price` in the catalog will have zero effect on the generated custom order.

## 16. Concurrency & Idempotency

- **Concurrency**: `FOR UPDATE` locking during conversion ensures two admins clicking "Convert" simultaneously do not create two distinct Orders from one request.
- **Idempotency**: The customer's form submission and the Admin's quote submission will utilize the existing `IdempotencyKey` engine to prevent duplicate records resulting from network retries.

## 17. File / Image Handling

- Custom Requests will utilize the existing file upload infrastructure (e.g., S3/Vercel Blob) currently used for Products/Inquiries.
- `CustomRequest.referenceImages` stores standard URL strings in a JSON array.
- No parallel or bespoke upload system will be created.

## 18. OrderEvent & NotificationOutbox

- **CustomRequest Events**: Standard audit logs (`CustomRequest_SUBMITTED`, `QUOTE_READY`) will be tracked either via standard system logs or a lightweight JSON audit trail, avoiding pollution of the Phase 6 `OrderEvent` table until conversion.
- **Notifications**: Phase 7 will generate `NotificationOutbox` entries for:
  - Custom Request Received (To Customer)
  - Quote Ready for Review (To Customer)
  - Custom Order Created (To Customer, utilizing standard Order pipeline)

## 19. RBAC

- Customer: Can view and accept/decline only requests linked to their `userId` or `guestTokenHash`.
- Admin: Can view, modify quote, and convert any request. Enforced strictly via server-side session checks in Next.js Server Actions/APIs.

## 20. Phase 8 Boundary

Phase 7 will explicitly NOT implement:
- Unified Order Dashboard redesigns.
- Advanced mutation frameworks for existing orders.
- Only the specific Admin list/detail views for `CustomRequest` will be constructed.

## 21. Database Impact

- **New Enum**: `CustomRequestStatus`.
- **New Model**: `CustomRequest` (non-destructive, zero impact on historical orders).
- **Relations**: Appending `CustomRequest[]` to `User`, `Product`, and `Order`.
- **Migrations**: Safe, isolated table creation.

## 22. Testing Strategy

- **Customer Auth**: Verification of Guest vs Authenticated isolation.
- **State Transitions**: Ensure quotes cannot be modified after `CUSTOMER_ACCEPTED`.
- **Conversion Lock**: Concurrent tests validating that simultaneous conversion requests yield only one Order.
- **Financial Mapping**: Asserting the converted Order matches the exact quoted price and advance.

## 23. Rollback Strategy

- Application: Revert Next.js routes and UI components.
- Database: Safe drop of `CustomRequest` table (or leave dormant). Converted Orders remain fully valid standard MTO Orders.

## 24. Risks

- Handling Guest user identity securely across the request-to-order pipeline. Relying on `guestTokenHash` requires exact parity with the Phase 2 checkout implementation.

## 25. Open Business Decisions

1. **Automatic vs Manual Conversion**: Upon customer acceptance, does the system immediately generate the Order, or does an Admin explicitly click "Convert"? (Recommendation: Automatic conversion upon customer acceptance to reduce friction).
2. **Payment at Acceptance**: Can a customer accept the quote and pay the advance in a single unified checkout flow, or are these two distinct steps?

## 26. Explicit Out-of-Scope

- Full Admin Order Management (Phase 8).
- Document and PDF Generation engines (Phase 9).
- Phase 6 Quality Control, Dispatch, or Refund capabilities.

## 27. Acceptance Criteria

1. Prisma schema includes `CustomRequest` and `CustomRequestStatus`.
2. Existing `Inquiry` logic remains undisturbed.
3. Customers can securely submit Custom Requests with images.
4. Admins can securely issue quotations.
5. Customers can accept or decline quotations.
6. Accepted quotes convert into exactly one `Order` carrying the snapshot financial terms.
7. Converted Orders seamlessly integrate into the Phase 5/6 Payment Ledger for Advance Collection.

==============================================================
STATUS: AWAITING APPROVAL
==============================================================
