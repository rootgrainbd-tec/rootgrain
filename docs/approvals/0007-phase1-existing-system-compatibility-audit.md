# 0007-PHASE1-EXISTING-SYSTEM-COMPATIBILITY-AUDIT

**Document:** docs/approvals/0007-phase1-existing-system-compatibility-audit.md
**Status:** PHASE 1 REMEDIATION AUDIT COMPLETE

## 1. PHASE 1 OBJECTIVE
The objective of Phase 1 is to build an evidence-based map of the CURRENT RootGrain system before implementing the Phase 2 financial, MTO, and Custom Order rules. This is a read-only compatibility and regression risk assessment.

---

# PHASE 1 REMEDIATION AUDIT
*The following sections contain the requested deep-dive evidence, test mappings, and transaction boundary analyses to satisfy the remediation gate.*

## 2. EXISTING DATABASE / TEST ORDER EVIDENCE
**NOT VERIFIED — RUNTIME DATABASE ACCESS UNAVAILABLE**
Current runtime database state remains unverified. The project-provided information states that there are 10 orders and all are test orders, but this could not be independently verified against the runtime database during Phase 1.

## 3. PRISMA SCHEMA DEEP AUDIT
An analysis of the existing `prisma/schema.prisma` constraints affecting financial data:

| Model | Relation | Unique | Index | onDelete | Financial Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `OrderItem` | `orderId` → `Order` | None | `[orderId]` | **ON DELETE CASCADE** | High (deleting Order deletes items) |
| `OrderItem` | `productId` → `Product` | None | `[productId]` | RESTRICT | Low (prevents deleting active products) |
| `PaymentRecord`| `orderId` → `Order` | `[orderId, type]` | `[status]` | **ON DELETE CASCADE** | High (deleting Order destroys payments) |
| `Order` | `userId` → `User` | None | `[userId]` | SET NULL (implicit) | Low (preserves financial record if User deleted) |
| `Address` | `userId` → `User` | None | None | **ON DELETE CASCADE** | Low (non-financial) |
| `Wishlist` | `userId` → `User` | `[userId, productId]`| None | **ON DELETE CASCADE** | Low (non-financial) |
| `Session`/`Account`| `userId` → `User` | Various | `[userId]` | **ON DELETE CASCADE** | Low (non-financial) |

*(Note: `PaymentRecord` and `OrderItem` both possess `ON DELETE CASCADE` from `Order`. Financially material records must not be exposed to destructive ON DELETE CASCADE behavior. Phase 2 must strictly avoid Order hard-deletes).*

## 4. ORDER FINANCIAL DATA SNAPSHOT AUDIT
**Status: VERIFIED (Snapshotted)**
Historical order financial values ARE stored independently of current Product values.
- `Order` natively stores: `subtotal`, `total`, `shippingCost`, `advancePaid`, `balanceDue`, `discountAmount`.
- `OrderItem` natively stores: `quantity`, `unitPrice`, `total`, `productName`.
**Conclusion:** If `Product.price` or `Product.name` changes today, legacy orders can be reconstructed correctly using the immutable copies stored on the `OrderItem` and `Order` tables.

## 5. CHECKOUT TRANSACTION DEEP AUDIT
Trace of `CheckoutService.processCheckout` (`src/services/checkout.service.ts`):
**Transaction Sequence:**
BEGIN
1. Validation (Schema/Zod) -> *Outside DB TX*
2. Product fetch (`findProductsBySlugs`) -> *Outside DB TX*
3. Shipping Calculation (`ShippingEngine`) -> *Outside DB TX*
4. Promo Fetch (`getPromoByCode`) -> *Outside DB TX*
5. **PRISMA TRANSACTION BEGINS**
6. → `tx.promoCode.updateMany` (Atomic usage increment using `{ currentUses: { lt: maxUses } }`)
7. → `tx.order.create` (Creates Order and nested OrderItems)
8. **PRISMA TRANSACTION COMMITS**
9. Send Email (`sendOrderConfirmationEmail`) -> *Un-awaited, outside TX*
10. Abandoned Cart Recovery (`markCartsAsRecovered`) -> *Caught block, outside TX*

## 6. EXISTING EMAIL TRANSACTION BOUNDARY
Trace of `sendOrderConfirmationEmail`:
- **Call Site:** Bottom of `CheckoutService.processCheckout`.
- **Awaited:** NO (`.catch(console.error)`).
- **Inside DB TX:** NO.
- **Failure Behavior:** If the email fails, the error is swallowed and logged. The `Order` remains successfully committed.
- **Crash Behavior:** If the server crashes after the DB commit but before the async email fires, the email is permanently lost. Duplicate emails on retry are impossible because checkout idempotent retry does not exist.
- **Compatibility Risk:** HIGH. Phase 2 NotificationOutbox must solve this.

## 7. API INVENTORY
| Method | Route/Action | Auth | Role | Service | Purpose | Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| POST | `/api/checkout` | `getServerSession` | User/Guest | `CheckoutService` | Process checkout | Cart/Checkout UI |
| GET/POST| `/api/user/wishlist` | `withAuth` | User | `UserService` | Get/Add to wishlist| Product UI |
| GET/PUT| `/api/user/profile` | `withAuth` | User | `UserService` | Profile details | Account UI |
| GET/POST| `/api/user/address` | `withAuth` | User | `UserService` | Address details | Account UI |
| ACTION | `updateOrderStatus` | `getServerSession` | ADMIN | `OrderService` | Admin modify state | Admin Dashboard |
| ACTION | `updateInquiryStatus` | `getServerSession` | ADMIN | `InquiryService` | Admin modify state | Admin Dashboard |
| ALL | **Payments** | NONE | N/A | NONE | MISSING | N/A |
| ALL | **Notification/Outbox**| NONE | N/A | NONE | MISSING | N/A |

## 8. AUTOMATED TEST COVERAGE AUDIT
**Framework:** Vitest
- **Checkout & Cart Validation:** TESTED (`checkout.next-sec-02-slice-2.test.ts`, `cart.a3-validation.test.ts`).
- **Promo Concurrency:** TESTED (`promo-toctou.test.ts` proves the TOCTOU bug was fixed).
- **Authentication:** TESTED (`auth.h3-a1.test.ts`).
- **Admin/Payments/Wishlist/Shipping:** NOT TESTED.

## 9. AUTHORIZATION / RBAC AUDIT
- **Implementation:** `admin.ts` explicitly enforces `if (!session || session.user.role !== Role.ADMIN)` before mutating data.
- **Status Gaps:** The infrastructure is sound and ready for reuse. However, there are no endpoints yet for Payment creation, Price Revision, or Document Issuance, so they currently have no implemented checks.

## 10. WISHLIST DATABASE VERIFICATION
- **Database Constraint:** `@@unique([userId, productId])` DOES exist in `schema.prisma`.
- **API Bug Proof:** `POST /api/user/wishlist` -> `userRepository.addWishlistItem` -> `prisma.wishlist.upsert({ update: {} })`. The `upsert` explicitly swallows the unique constraint violation by blindly returning the existing record.
- **Classification: BUGGY** (1st click: Add. 2nd click: Remove. Currently fails). Future fix belongs to Phase 10.

## 11. PROMO CONCURRENCY AUDIT
**Status: LOW RISK**
Repository evidence reports promo concurrency as tested and mitigated. The test `promo-toctou.test.ts` combined with the atomic `updateMany` (where `currentUses < maxUses`) evidences this mitigation.

## 12. BUY NOW ARCHITECTURE AUDIT
**Status: REUSE WITH VALIDATION**
`CheckoutService.processCheckout` accepts a detached `payload.items` array and does not strictly couple to cart database state. The Buy Now feature can reuse the existing pipeline by injecting a single-item payload directly from the frontend. However, Phase 3 repository/data mapping must validate: single-item payload, product availability, quantity, current price validation, promo compatibility, shipping, authentication/guest behavior, duplicate submission behavior, and order creation compatibility.

## 13. MTO / CUSTOM ORDER SEARCH COVERAGE
Repository-wide search for `made-to-order`, `customRequest`, `MTO`, `custom order` yielded **0 results**. No partial or hidden implementation exists.

## 14. LEGACY ORDER COMPATIBILITY
Legacy Orders must NOT receive fabricated historical `OrderEvent` or `NotificationOutbox` history. Existing historical state remains preserved. New event tracking begins only when a new lifecycle mutation occurs after the new architecture is introduced.

## 15. FINANCIAL DELETE RISK
**A. Application-level hard-delete exposure: LOW**
Repository search found no application-level hard-delete path for Order, PaymentRecord, or OrderItem.
**B. Schema-level destructive cascade risk: HIGH**
If an Order hard-delete path is ever introduced, existing ON DELETE CASCADE relationships can destroy OrderItem and PaymentRecord.
**Architectural Implication:** Production financial Orders MUST NOT be hard-deleted. Future lifecycle handling should use status/state transitions or archival semantics rather than destructive Order deletion.

## 16. DOCUMENT / EVENT / OUTBOX SEARCH
Global searches for `OrderEvent`, `NotificationOutbox`, `CustomerNotification`, `Event`, `Document` returned **0 results** in business logic.

## 17. PAYMENT STATE: MODEL VS WORKFLOW
**A. Payment data/model foundation: EXISTS**
The Prisma schema contains the `PaymentRecord` model, payment status/type fields, and related enums (e.g., `PENDING_ADVANCE`).
**B. Operational payment workflow: MISSING / NOT IMPLEMENTED**
There is no payment creation API, payment validation lifecycle, payment receipt, payment void, or history workflow.

## 18. COD VS PAYMENT TYPE
COD is currently treated as a checkout payment method. The frozen business contract in Phase 2 will explicitly distinguish Payment Type (ADVANCE, INSTALLMENT, COD as lifecycle classifications) from Payment Method (the actual collection mechanism). Phase 2 will freeze this exact distinction.

---

## 19. PHASE 1 COMPATIBILITY MATRIX — REVALIDATED

| Requirement | Current Implementation | Classification |
| :--- | :--- | :--- |
| **NORMAL ORDER** | `Order`, `CheckoutService` exist | REQUIRES REFACTOR |
| **MTO** | No schema or logic exists | REQUIRES NEW IMPLEMENTATION |
| **CUSTOM ORDER** | No schema or logic exists | REQUIRES NEW IMPLEMENTATION |
| **ADVANCE** | `PENDING_ADVANCE` state exists | REQUIRES REFACTOR |
| **INSTALLMENT** | No DB/logic exists | REQUIRES NEW IMPLEMENTATION |
| **COD** | Checkout payment method | REQUIRES REFACTOR |
| **PRICE REVISION** | No DB/logic exists | REQUIRES NEW IMPLEMENTATION |
| **DELIVERY TBD** | `ShippingEngine` blocks this | REQUIRES REFACTOR |
| **FINAL INVOICE** | No DB/logic exists | REQUIRES NEW IMPLEMENTATION |
| **PAYMENT RECEIPT** | No DB/logic exists | REQUIRES NEW IMPLEMENTATION |
| **WISHLIST TOGGLE** | Upsert bug masks duplicate errors | BUGGY |
| **WHATSAPP/OUTBOX**| Inline un-awaited emails only | REQUIRES NEW IMPLEMENTATION |

---

## 20. CURRENT RISKS & UNKNOWN REGISTER

| ID | Issue / Risk | Classification | Notes |
| :--- | :--- | :--- | :--- |
| **CU-01** | Runtime Data State | NOT VERIFIED | Project context says 10 orders, all test orders. Runtime DB could not verify this. No data invented/modified. |
| **RISK-01** | Stock Race Condition | VERIFIED RISK | Checkout lacks atomic stock decrement inside the transaction. Identified in Phase 1 as a current compatibility/race risk. Ownership for the technical correction belongs to the later Database / Transaction Foundation (Phase 4) and relevant implementation phases. |

---

## 21. PHASE 1 EXIT CRITERIA
1. Existing repository scope mapped: **YES**
2. Existing Order/Checkout architecture evidenced: **YES**
3. Payment model/data foundation evidenced: **YES**
4. Operational payment workflow status evidenced: **YES**
5. DB relationships/constraints evidenced: **YES**
6. API surface mapped: **YES**
7. Test coverage mapped: **YES**
8. Authorization mapped: **YES**
9. Email/notification boundary mapped: **YES**
10. Promo concurrency assessed: **YES**
11. Wishlist DB constraint verified: **YES**
12. Runtime data limitation explicitly documented: **YES**
13. Critical current risks classified: **YES**
14. Previous findings preserved: **YES**

---

## 22. APPROVAL GATE

PHASE 1 GATE:
READY FOR PHASE 2
