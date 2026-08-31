ROOTGRAIN — PHASE 7
CUSTOM ORDER REQUEST SYSTEM
REVISION 1 — ARCHITECTURAL HARDENING
==============================================================

## 1. Executive Summary

This document specifies the exact architectural foundation for Phase 7: Custom Order Request System (Revision 1). It defines the rigid boundary between MTO catalog items (Phase 6) and manual bespoke requests (Phase 7). It establishes the server-side, atomic flow for Quote Acceptance and Order Conversion, guaranteeing that the agreed commercial terms are safely snapshotted into the Order, utilizing strict idempotency and concurrency controls.

## 2. Roadmap Position

- **Phase 6 (MTO Engine)**: CLOSED. No further modifications allowed except for blocking defects.
- **Phase 7 (Custom Order Request System)**: CURRENT.
- **Phase 8 (Unified Admin Order Management)**: FUTURE.
- **Phase 9 (Documents & Communication)**: FUTURE.

All Phase 6 deferred features (QC, Dispatch, Refund, Accounting) remain explicitly deferred. Phase 7 isolates strictly to the Custom Request quoting and conversion loop.

## 3. Existing Architecture

The RootGrain platform operates on a separated state machine: `Order.status`, `Order.productionState`, and `Order.trackingState`. 
Orders are generated immediately at checkout. Custom Requests introduce a pre-order lifecycle where a quote must be formalized and accepted prior to the creation of the Order.

## 4. Inquiry Findings

The existing `Inquiry` model is an active, lightweight contact form mechanism used for lead generation (e.g., "I want to inquire about this product"). 
- It lacks the relational schema required for formal quotation and Order linkage.
- It will remain active and unchanged for simple contact purposes.
- Custom Order Request is a distinct, heavier feature requiring a new `CustomRequest` model.

## 5. CustomRequest Findings

`CustomRequest` is completely absent from the current repository. No models, UI, or services currently exist. Phase 7 will construct this entire boundary.

## 6. MTO vs Custom Boundary

| Capability | Phase 6: MTO | Phase 7: Custom Request |
|------------|--------------|-------------------------|
| Catalog Product | Yes | Optional |
| Fixed Catalog Price | Yes | No (Manual Quote Required) |
| Bespoke Dimensions | No | Yes |
| Bespoke Wood/Design | No | Yes |
| Quotation Required | No | Yes |
| Manufacturing | Yes | Yes (Post-Conversion) |

## 7. Final Business Lifecycle

1. **Submit**: Customer submits a Custom Request (details, dimensions, images).
2. **Review**: Admin reviews the request.
3. **Quotation**: Admin issues a formal quote (Price, Required Advance, Delivery Charge).
4. **Accept & Convert**: Customer accepts the quote, which atomically generates the formal `Order`.
5. **Fulfillment**: The Order enters the Phase 5/6 financial and manufacturing lifecycle.

## 8. State Machine

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

- **SUBMITTED**: Customer submitted request. Admin can begin review.
- **UNDER_REVIEW**: Admin is reviewing/drafting the quote.
- **QUOTE_READY**: Immutable customer-facing quotation.
- **CUSTOMER_DECLINED**: Terminal state. No order created.
- **CONVERTED**: Terminal state. Quote accepted, Order atomically created.
- **CANCELLED**: Terminal state. Admin closed request without quote.

## 9. Data Model (Schema Impact)

```prisma
model CustomRequest {
  id               String   @id @default(cuid())
  userId           String?  
  guestTokenHash   String?  
  name             String
  email            String
  phone            String

  // Request Specification
  productId        String?  
  description      String
  requestedWood    String?
  requestedDims    String?
  quantity         Int      @default(1)
  referenceImages  Json?    // Array of strings (secure storage URLs)

  // Quotation (Immutable after QUOTE_READY)
  quotedPrice      Int?
  requiredAdvance  Int?
  deliveryCharge   Int?
  commercialTerms  String?

  status           CustomRequestStatus @default(SUBMITTED)
  adminNotes       String?
  
  orderId          String?  @unique
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User?    @relation(fields: [userId], references: [id])
  product          Product? @relation(fields: [productId], references: [id])
  order            Order?   @relation(fields: [orderId], references: [id], onDelete: Restrict)
  events           CustomRequestEvent[]

  @@index([userId])
  @@index([guestTokenHash])
  @@index([status])
}

model CustomRequestEvent {
  id               String   @id @default(cuid())
  customRequestId  String
  sequence         Int
  eventType        String
  payload          Json
  actor            Json
  occurredAt       DateTime @default(now())
  request          CustomRequest @relation(fields: [customRequestId], references: [id], onDelete: Restrict)

  @@unique([customRequestId, sequence])
  @@index([customRequestId])
}
```

## 10. Quote Architecture

- Quotation values (`quotedPrice`, `requiredAdvance`, `deliveryCharge`, `commercialTerms`) live on the `CustomRequest`.
- **Pre-Quote**: Admin may modify these fields while in `SUBMITTED` or `UNDER_REVIEW`.
- **Quote Ready**: Admin transitions state to `QUOTE_READY`. From this moment, the quotation fields are **STRICTLY IMMUTABLE**.
- If a customer desires changes after `QUOTE_READY`, a new request or revision flow must be instantiated (Revision flow is deferred; currently must Cancel and Re-Submit).

## 11. Customer Workflow

- Customer submits the request (authenticated or via guest token).
- Wait for notification.
- Customer receives email: "Quote Ready".
- Customer views the read-only quotation.
- Customer clicks **Accept Quote** (triggers server-side atomic conversion) OR **Decline Quote**.

## 12. Admin Workflow

- Admin views `SUBMITTED` requests in a dedicated Phase 7 UI.
- Admin transitions to `UNDER_REVIEW`, inspects details.
- Admin enters quote fields and sets state to `QUOTE_READY`.
- Admin *cannot* edit quotation after `QUOTE_READY`.
- Admin *cannot* manually click "Convert to Order". The Customer Accept action drives conversion.

## 13. Acceptance / Decline

- **Customer Acceptance**: Must be a secure, server-side POST request. The client does NOT submit financial terms. The server loads the `QUOTE_READY` request, verifies ownership, and atomically converts it to an Order.
- **Customer Decline**: Transitions to `CUSTOMER_DECLINED`. No financial or Order side-effects occur. This action is final and idempotent.

## 14. Conversion Transaction (Atomic Flow)

`CUSTOMER_ACCEPTED` is bypassed as a discrete database status. The Customer's "Accept" action triggers atomic Order creation:

1. `BEGIN`
2. Claim `IdempotencyKey` for the customer's acceptance action.
3. `SELECT * FROM "CustomRequest" WHERE id = $1 FOR UPDATE`
4. Assert `status = QUOTE_READY` and `orderId IS NULL`.
5. Insert `Order`:
   - Map financial terms (see Section 15).
   - `isMtoOrder = true`
   - `status = PENDING_ADVANCE`
6. Insert `OrderItem` snapshotting the custom specification (see Section 16).
7. Update `CustomRequest.status = CONVERTED` and `CustomRequest.orderId = Order.id`.
8. Insert `OrderEvent` (ORDER_CREATED_FROM_CUSTOM_REQUEST).
9. Complete `IdempotencyKey`.
10. `COMMIT`

## 15. Financial Mapping

Based on the actual `checkout.service.ts` logic, the Order financial snapshot will map as follows:

- `Order.subtotal` = `CustomRequest.quotedPrice`
- `Order.shippingCost` = `CustomRequest.deliveryCharge`
- `Order.discountAmount` = 0 (Discounts are baked into the manual quote)
- `Order.total` = `quotedPrice` + `deliveryCharge`
- `Order.balanceDue` = `Order.total`
- `Order.requiredAdvance` = `CustomRequest.requiredAdvance`

## 16. Snapshot Architecture

- The generated `OrderItem` must store the historical specification. 
- `OrderItem.unitPrice` = `CustomRequest.quotedPrice`.
- `OrderItem.quantity` = `CustomRequest.quantity`.
- `OrderItem.total` = `quotedPrice * quantity`.
- `OrderItem.productName` = `Custom Product: [Name/Desc]`.
- Modifying `Product.price` in the standard catalog will have **zero** impact on this converted Order, as the values are snapshotted in `OrderItem` and `Order` totals.

## 17. Audit / Event Architecture

- The existing `OrderEvent` is strictly tied to an `orderId`. It cannot be used prior to conversion.
- `AuditLog` is RBAC-focused and unsuited for ordered lifecycle events.
- **Solution**: A lightweight `CustomRequestEvent` model (mirroring `OrderEvent`) will log:
  - `CUSTOM_REQUEST_SUBMITTED`
  - `QUOTE_READY`
  - `CUSTOMER_DECLINED`
  - `CONVERTED_TO_ORDER`
- Upon conversion, the standard `OrderEvent` pipeline takes over for the resulting Order.

## 18. Notification Architecture

- Reuse existing `NotificationOutbox` where possible.
- Requires notifications for:
  - Request Received (To Customer)
  - Quote Ready (To Customer)
  - Custom Order Created (To Customer)

## 19. Idempotency

The existing robust `IdempotencyKey` engine (`ownerType`, `ownerId`, `scope`, `key`, `fingerprint`) will safeguard:
1. Customer Submission (prevents double-submit).
2. Admin Quote Creation.
3. Customer Accept / Convert.
4. Customer Decline.

Concurrent Acceptance: The first request claims the key and acquires the `FOR UPDATE` lock. The second request yields an `IdempotencyClaimConflictSignal` or recovers the completed response payload, ensuring exactly one Order is generated.

## 20. Guest Security

- Guest access strictly requires a cryptographically secure token.
- At submission, `generateGuestTrackingToken()` generates the raw token, which is emailed to the customer.
- The `guestTokenHash` is stored on the `CustomRequest`.
- Quote Acceptance API calls MUST supply the raw token via headers/cookies. The server compares `hash(rawToken)` to `guestTokenHash`.
- Guests can strictly access only their own requests and cannot enumerate IDs.

## 21. Upload Architecture

- **Finding**: There is zero existing customer-facing file upload infrastructure. Sanity is strictly a CMS for Admin content and cannot securely accept unauthenticated customer evidence.
- **Solution**: Phase 7 must provision a secure object storage boundary (e.g., Vercel Blob or AWS S3).
- **Constraints**: 
  - Valid image types only (JPG, PNG, WEBP).
  - Max 5MB per file.
  - Max 5 files per request.
  - Unverified external URLs will not be accepted.

## 22. RBAC

- Customer (User/Guest): Can view, accept, or decline ONLY their owned requests.
- Admin: Can view, modify drafts, and issue quotes across all requests via strictly protected Server Actions.

## 23. Phase 8 Boundary

- Strictly limited to a single `Custom Requests` table in the Admin panel.
- No generalized unified order dashboard overhauls will be executed.

## 24. Database Impact

- **Models**: Add `CustomRequest`, `CustomRequestEvent`. Add `CustomRequestStatus` enum.
- **Relations**: Extend `User`, `Product`, `Order` with `CustomRequest[]`.
- **Risk**: 0%. Isolated schema additions with zero mutation of historical tables.

## 25. Testing

- Authenticated / Guest submission flows.
- Guest token security constraints (403 on invalid token).
- Transition state locks (reject edit after `QUOTE_READY`).
- Atomic Conversion (Concurrency tests for simultaneous acceptance ensuring 1 Order).
- Idempotency replay verification.

## 26. Rollback

- **Code**: Standard Git revert of Phase 7 branch.
- **Database**: Safe drop of `CustomRequest` and `CustomRequestEvent`. Generated Orders remain intact as standard MTO Orders.

## 27. Risks

- Managing transient object storage for uploads that are abandoned before submission. A cron cleanup or TTL strategy is recommended for orphaned files.

## 28. Open Business Decisions

- **Acceptance/Payment Sequence**: Upon atomic conversion, the order is created in `PENDING_ADVANCE`. Does the client UI immediately redirect to the payment gateway to satisfy the advance, or does it stop at "Order Created" and send an email link? (Recommendation: Redirect to payment flow immediately upon acceptance).

## 29. Acceptance Criteria

- [ ] `CustomRequest` and `CustomRequestEvent` models exist in Prisma.
- [ ] Customers can securely submit requests with attached images (Vercel Blob/S3).
- [ ] Admins can issue quotes; quotes become immutable upon `QUOTE_READY`.
- [ ] Customers can accept or decline `QUOTE_READY` quotes.
- [ ] Acceptance triggers a safe, idempotent atomic conversion to a standard `Order`.
- [ ] The generated Order accurately mirrors the exact snapshot financial quote.
- [ ] Converted orders utilize the Phase 5/6 Payment Ledger perfectly.
- [ ] Guest security tokens prevent unauthorized access to private quotation terms.

## 30. Explicit Out-of-Scope

- Phase 6 modifications (QC, Final Invoice, Dispatch).
- Phase 8 Admin Unified Order Management.
- Quotation Revisions (must cancel and re-submit for now).

==============================================================
STATUS: AWAITING APPROVAL
==============================================================
