ROOTGRAIN — PHASE 7
CUSTOM ORDER REQUEST SYSTEM
REVISION 2 — IMPLEMENTATION-READINESS HARDENING
==============================================================

## 1. Business Scenario

A customer may contact RootGrain through offline channels (phone, in-person) or submit a request directly via the website. A Custom Request encapsulates multiple bespoke items (e.g., 1 Door, 2 Chairs), each with discrete specifications and a negotiated unit price. 

The system gracefully supports:
1. Customer-driven web requests (requiring a formal server-side quotation and acceptance flow).
2. Admin-driven requests where the customer and RootGrain have already negotiated and agreed on terms offline, completely bypassing the redundant online quotation and acceptance steps.

## 2. Roadmap Position

- **Phase 6**: CLOSED. No QC, Dispatch, Refund, or Accounting implementations.
- **Phase 7**: CURRENT. Focuses strictly on capturing Custom Requests, managing quotes, and securely converting them into standard Phase 6 Orders.
- **Phase 8**: FUTURE. (Unified Admin Order Management).
- **Phase 9**: FUTURE. (Documents & Communication).

## 3. Identity

A customer's Mobile Number is **REQUIRED**. Email is **OPTIONAL**. 
The NextAuth `User` model strictly requires unique emails and will **NOT** be modified. Dummy User accounts will not be created. Customers without emails will simply store their identity (Name, Phone, Email) directly inline on the `CustomRequest`.

## 4. Mobile-first Model

Mobile numbers are contact identifiers, not secret authentication keys. There is NO unique constraint on the mobile number in `CustomRequest`. Customers can submit multiple requests. Admins will discover historical requests by searching phone numbers across existing `CustomRequest` and `Order` tables, without merging disparate identities.

## 5. Creation Channels

The `CustomRequest` must declare its exact source via `CustomRequestChannel`:

A. **CUSTOMER_ONLINE**: Customer created the request via the public website form.
B. **ADMIN_OFFLINE**: Admin created the request on behalf of the customer following an offline conversation.

## 6. Customer Online Flow

1. **Submit**: Customer submits online (`CUSTOMER_ONLINE`). Mobile required, email optional.
2. **State**: `SUBMITTED`.
3. **Review**: Admin reviews the request, calculates quotes for items, and validates delivery.
4. **Quote**: Admin sets state to `QUOTE_READY`. (At this state, all item unit prices, delivery charge, and required advance MUST be explicitly non-null).
5. **Accept**: Customer reviews the quote via their secure guest link and explicitly clicks "Accept", triggering atomic server-side conversion to `CONVERTED` and generating the Order.

## 7. Admin Offline Flow

1. **Create**: Admin clicks "Create Custom Request" (`ADMIN_OFFLINE`), populating the offline-agreed items, specifications, and explicitly defined prices.
2. **Offline Agreement**: Because commercial terms were already agreed verbally/offline, the Admin bypasses `QUOTE_READY` entirely.
3. **Convert**: Server-side authorization ensures the Admin provided valid prices and required metrics. Admin triggers the **Convert** action, pushing the request immediately to `CONVERTED` and automatically generating the final `Order`.

## 8. Multi-item Model

A Custom Request is a container for multiple items. The `CustomRequestItem` model tracks each bespoke item.

```prisma
model CustomRequestItem {
  id               String   @id @default(cuid())
  customRequestId  String
  
  name             String
  quantity         Int      @default(1)
  designSpecs      String?  
  dimensions       String?
  material         String?
  finish           String?
  notes            String?
  
  // Array of durable storage representations (not raw signed URLs)
  referenceImages  Json?    
  
  agreedUnitPrice  Int?     // Nullable during drafts. Required for QUOTE_READY or Conversion.

  customRequest    CustomRequest @relation(fields: [customRequestId], references: [id], onDelete: Cascade)
}
```

## 9. Pricing

Prices are rigorously calculated to mirror standard RootGrain Order semantics:
- **`CustomRequestItem.itemTotal`**: `agreedUnitPrice` × `quantity`.
- **`CustomRequest.subtotal`**: SUM(all `itemTotal`s). (Persisted on `CustomRequest`).
- **`CustomRequest.deliveryCharge`**: Explicitly set by Admin. (Persisted).
- **`CustomRequest.total`**: `subtotal` + `deliveryCharge`. (Persisted).

*Note:* `balanceDue` is strictly a function of the resulting `Order` and `PaymentService`. `CustomRequest` does NOT maintain a `balanceDue` or duplicate payment ledger capabilities.

## 10. Required Advance

In Phase 6 MTO, `requiredAdvance` defaults to 50% (`Math.floor(total * 0.5)`). 
For Custom Requests, the system provides 50% as a UI default, but the Admin **MUST** be able to explicitly override `requiredAdvance` (e.g., 30%, 100%, or flat amounts) during Quote preparation or Admin Offline creation.
Server-side validation guarantees: `requiredAdvance >= 0` and `requiredAdvance <= total`.

## 11. Estimated Completion

`estimatedCompletionDate` represents a specific target calendar date, whereas existing `Order.estimatedManufacturingDays` represents a duration.
To preserve exact business intent, an explicit `estimatedCompletionDate DateTime?` field must be added to BOTH `CustomRequest` (for the pre-conversion agreement) and `Order` (for the authoritative post-conversion snapshot). 

## 12. State Machine

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

| Current | Action | Actor | Next | Allowed |
|---------|--------|-------|------|---------|
| `SUBMITTED` | Review | Admin | `UNDER_REVIEW` | Both Channels |
| `UNDER_REVIEW` | Quote | Admin | `QUOTE_READY` | `CUSTOMER_ONLINE` |
| `QUOTE_READY` | Accept | Customer | `CONVERTED` | `CUSTOMER_ONLINE` |
| `QUOTE_READY` | Decline | Customer | `CUSTOMER_DECLINED` | `CUSTOMER_ONLINE` |
| `SUBMITTED`/`UNDER_REVIEW` | Convert | Admin | `CONVERTED` | `ADMIN_OFFLINE` (Requires valid prices) |
| Any Pre-Converted | Cancel | Admin | `CANCELLED` | Both Channels |

## 13. Conversion

Conversion is an atomic (`FOR UPDATE`), Idempotency-protected transaction bridging the gap from request to financial fulfillment.

1. **BEGIN** transaction.
2. `SELECT CustomRequest FOR UPDATE`.
3. Assert status eligibility and `orderId IS NULL`.
4. Assert valid customer identity, valid item quantities (`>= 1`), and non-null `agreedUnitPrice`s.
5. Create `Order` (`subtotal`, `shippingCost` = `deliveryCharge`, `total`, `requiredAdvance`, `isMtoOrder = true`).
6. Create `OrderItem` snapshots.
7. Set `CustomRequest.status = CONVERTED` and `CustomRequest.orderId = Order.id`.
8. Insert `CustomRequestEvent` (CONVERTED) and `OrderEvent` (ORDER_CREATED_FROM_CUSTOM_REQUEST).
9. **COMMIT**.

## 14. Snapshot

The resulting `OrderItem` must independently capture the custom details without relying on external Product relations. 
Since `OrderItem` currently lacks a dedicated notes field, a new `customSpecification String?` field MUST be added to `OrderItem` to cleanly persist the design, dimensions, and material details requested, avoiding clumsy concatenation into `productName`.

## 15. Product ID Strategy

**Recommendation**: Alter `OrderItem.productId` to become nullable (`String?`).
**Evidence**: An audit reveals `OrderItem` predominantly relies on the natively snapshotted `productName`, `unitPrice`, and `total`. Queries mostly use `item.productName`.
Making `productId` nullable safely accommodates bespoke items without polluting the core catalog with fake "Placeholder" products.
**Regression Risk**: Low, provided UI gracefully falls back to `productName` where it previously blindly assumed `product.name` existed.

## 16. Audit

A lightweight, append-only `CustomRequestEvent` model (mirroring `OrderEvent`) tracks the pre-Order lifecycle.

**CUSTOMER_ONLINE**:
`CUSTOM_REQUEST_SUBMITTED` → `QUOTE_READY` → `CUSTOMER_ACCEPTED` → `CONVERTED`

**ADMIN_OFFLINE**:
`CUSTOM_REQUEST_SUBMITTED` → `ADMIN_ACCEPTED_OFFLINE` → `CONVERTED`

*(Note: `CUSTOMER_ACCEPTED` is logged as an Event immediately preceding the `CONVERTED` transaction. It does not require a discrete database status).*

## 17. Idempotency

The existing `IdempotencyKey` engine securely envelopes all state-changing commands. Concurrent conversions (e.g., Admin clicks Convert while Customer accepts online) will collide at the `FOR UPDATE` lock; the loser receives an `IdempotencyClaimConflictSignal` or a recovered success response, guaranteeing strictly one Order is generated.

## 18. Guest Security

Guests access requests securely via a `guestTokenHash` flow (mirroring Guest Orders). A cryptographically secure token is generated and emailed to the user; the server stores the hash. Any action (Viewing Quote, Accepting, Declining) explicitly requires presenting the raw token.

## 19. Upload Architecture

**Recommendation**: Vercel Blob.
**Evidence**: No existing upload providers (S3/Cloudinary) exist in `package.json`. Vercel Blob is the native, zero-config object storage for the Next.js/Vercel ecosystem.
- **Access**: Private (signed URLs required for viewing).
- **Restrictions**: `image/jpeg`, `image/png`, `image/webp`. Max 5MB per file. Max 5 files per item.
- **Storage Representation**: `referenceImages` JSON stores durable metadata (provider ID, mime type, size), NOT raw expiring URLs. Signed URLs are generated dynamically at read time.
- **Cleanup**: A cron job/TTL will delete orphaned blobs belonging to unsubmitted Custom Requests.

## 20. Notifications

Without an SMS gateway, mobile-only customers cannot receive automated NextAuth/Nodemailer links. Admins must rely on manual communication (e.g., phoning the customer) to alert them when a quote is ready or an order is created. 

## 21. Payment Integration

Converted Orders trigger no new payment code. The Order is handed off seamlessly to the existing `PaymentService` and Payment Ledger workflows, preserving absolute financial integrity.

## 22. Database Impact

- **New Models**: `CustomRequest`, `CustomRequestItem`, `CustomRequestEvent`.
- **New Enums**: `CustomRequestStatus`, `CustomRequestChannel`.
- **Modifications**: 
  - Add `estimatedCompletionDate DateTime?` to `Order` and `CustomRequest`.
  - Modify `OrderItem.productId` to `String?`.
  - Add `customSpecification String?` to `OrderItem`.

*(No migrations will be generated during this specification phase).*

## 23. Testing

- Nullable `OrderItem.productId` regression test across Order Admin UI and Invoice PDFs.
- Admin offline creation directly triggering Order conversion.
- Financial total reconciliation matching exact `CustomRequest` terms.
- Guest token isolation preventing enumeration attacks.
- Idempotency replay on duplicate Customer Accept attempts.

## 24. Risks

- **Nullable productId Regression**: Analytics or UI fragments blindly assuming `product.image` exists may crash if unhandled.
- **Orphan Object Storage**: Blobs from abandoned form sessions incurring storage costs without cleanup.
- **Mobile-only Comm Friction**: Admin manual overhead in communicating with email-less customers.

## 25. Technical Decisions

None remaining. `OrderItem.productId` nullability, `estimatedCompletionDate` mapping, and Vercel Blob upload architecture have been explicitly architected based on repository constraints.

## 26. Acceptance Criteria

- [ ] Mobile is required; Email is optional. No dummy `User` accounts are created.
- [ ] `ADMIN_OFFLINE` requests can convert directly to Orders, bypassing the quotation phase.
- [ ] `CUSTOMER_ONLINE` requests securely mandate Quote creation and explicit Customer Acceptance.
- [ ] `CustomRequestItem` holds item-level specifications and prices.
- [ ] Atomic Conversion gracefully snapshots all terms into a standard Order and `OrderItem`s.
- [ ] Idempotency strictly blocks duplicate orders from concurrent conversion attempts.

## 27. Explicit Out-of-Scope

- SMS / WhatsApp Gateway Integration.
- Quote versioning/revisions.
- Phase 8 Admin Unified Order Management.
- Phase 6 modifications (QC, Final Invoice, Dispatch, Delivery).

==============================================================
STATUS: AWAITING APPROVAL
==============================================================
