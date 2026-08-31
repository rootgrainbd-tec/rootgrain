# PHASE 6 — MTO (MADE-TO-ORDER) ORDER SYSTEM
# SLICE 2 — CUSTOMER PURCHASE FLOW (APPROVAL DIRECTIVE)

## STATUS: AWAITING APPROVAL

## 1. OBJECTIVE
Implement the customer-facing MTO purchase flow (Direct Buy, MTO Checkout, Coupon, Shipping, Order Creation) while maintaining strict isolation from the existing Available Product cart and checkout flow.

## 2. EXISTING ARCHITECTURE FINDINGS & RESOLUTIONS

### A. Sanity ↔ Prisma Product Source of Truth
**Finding:** Currently, the storefront Product page fetches data from Sanity, but `isMto`, `baseLeadTimeDays`, and authoritative pricing/stock are stored in Prisma.
**Resolution:** **PRISMA is the strict, authoritative Source of Truth** for Product Identity, MTO Eligibility, Price, Availability, and Lead-Time configuration. 
- If Sanity and Prisma disagree on price or availability, Prisma wins.
- The Product page must be updated to fetch the Prisma record (via `slug`) to authoritatively determine `isMto` and render the Direct Buy button.

### B. Product ID / Slug Mapping
**Finding:** The existing codebase refers to product `slug` as the `id` in the cart and checkout service (e.g., `ProductRepository.findProductsBySlugs(productIds)`).
**Resolution:** The URL parameter `/checkout/mto?productId=<slug>` will represent the **Prisma Slug**. The MTO Checkout server will NOT trust the client; it will use `ProductRepository.findProductBySlug(productId)` to securely resolve the authoritative product, price, and MTO rules.

### C. Configuration vs Customer Note
**Finding:** The existing `OrderItem` and `Product` Prisma schemas have no native fields for capturing user-selected structured configuration variants (e.g., dynamic JSON options, color selection).
**Resolution:**
- **STRUCTURED PRODUCT CONFIGURATION: NOT SUPPORTED.** Slice 2 does not support structured product configuration because the existing architecture does not provide it.
- **CUSTOMER NOTE: SUPPORTED.** Customer Note is captured independently as an optional, free-text customer input. It is immutable after Order Creation and preserved as customer-provided text. 
If structured product configuration is required in the future, a SCHEMA CHANGE + UI CHANGE + APPROVAL IS REQUIRED.

### D. Real Server-Side Idempotency
**Finding:** A final investigation of `Order` unique constraints, guest token uniqueness, and checkout request identifiers confirms that the system generates new tracking tokens per request and lacks an `idempotencyKey` constraint. The existing checkout architecture cannot safely guarantee duplicate-order prevention against network retries or double submission at the database/transaction level.
**Resolution:** 
**SERVER-SIDE IDEMPOTENCY: NOT AVAILABLE IN CURRENT ARCHITECTURE.**
MTO financial order creation requires a future dedicated idempotency mechanism. That future mechanism MUST be handled through a separate schema/architecture approval before production-grade network-retry protection is claimed. (FUTURE ARCHITECTURAL REQUIREMENT)

### E. Required Advance Initialization
**Finding:** The `Order` Prisma model has a `requiredAdvance Int @default(0)` field.
**Resolution:** For MTO Orders, the server will explicitly calculate `requiredAdvance = Final MTO Order Total × 50%` and initialize this authoritative value in the DB during Order Creation.

### F. PENDING_ADVANCE Status
**Finding:** `PENDING_ADVANCE` is a valid, existing `OrderStatus` enum value and is the default for new orders.
**Resolution:** MTO Orders will natively reuse the `PENDING_ADVANCE` status upon creation.

## 3. ARCHITECTURAL DECISIONS

### Dedicated MTO Checkout Route
Create a dedicated MTO checkout route (`app/(storefront)/checkout/mto/page.tsx`) and API route (`app/api/checkout/mto/route.ts`).
**Rationale:** Guarantees strict MTO cart isolation. Normal checkout relies on `useCartStore`, whereas MTO bypasses the normal cart entirely.

### MTO Checkout API & Service
Create `CheckoutService.processMtoCheckout()`.
**Rationale:** Normal checkout enforces `inStock = true`. MTO products may legitimately have `inStock = false`. The new method reuses `ShippingEngine` and `PromoRepository` but enforces `isMtoOrder = true`.

## 4. UPDATE DATA & UI FLOW

1. **Product Page:** Fetches Sanity CMS data PLUS Prisma authoritative `isMto` flag.
2. **Direct Buy Action:** If `isMto === true`, UI shows `[ DIRECT BUY ]`. Normal cart insertion is blocked server/client-side.
3. **MTO Checkout UI:** `/checkout/mto?productId=<slug>&qty=<quantity>`
   - Fetches authoritative Prisma Product details server-side.
   - Validates Quantity (integer, >= 1).
   - Displays Price, 50% Required Advance, Customer Note input, existing Coupon input, Address selector.
4. **Validation (Server):** User submits -> Server resolves Product Identity by slug.
5. **Financial Integrity (Server):** The server MUST recalculate all authoritative financial values. The server does NOT trust client price, client subtotal, client shipping, client discount, client total, or client required advance.
6. **Transaction:** Server creates `Order` atomically, locking all financial fields.

## 5. REQUIRED SNAPSHOTS AT ORDER CREATION
The following immutable snapshot values must be explicitly captured during Order Creation:
- Product identity
- Unit price
- Quantity
- Product subtotal
- Shipping charge
- Coupon/discount result
- Final order total
- Customer Note
- Delivery address
- MTO flag
- Estimated manufacturing days
- Required advance

## 6. RBAC & AUTHENTICATION
MTO Checkout will exactly mirror existing checkout behavior, supporting both authenticated customers and Guest checkout (generating a guest tracking token).

## 7. FILES EXPECTED TO CHANGE / BE CREATED
**Modified:**
- `src/app/(storefront)/product/[slug]/page.tsx` (Add Prisma fetch)
- `src/components/product/ProductActions.tsx` (Render Direct Buy UI)
- `src/services/checkout.service.ts` (Add `processMtoCheckout`)
- `src/store/useCartStore.ts` (Add MTO guard)

**Created:**
- `src/app/(storefront)/checkout/mto/page.tsx` (Isolated UI)
- `src/app/api/checkout/mto/route.ts` (Isolated API endpoint)
- `src/validations/mto-checkout.schema.ts`

**Explicitly Frozen:**
- Normal Checkout UI & API
- Payment Ledger / PaymentService
- Admin functionalities

## 8. ACCEPTANCE CRITERIA
1. **Identity Resolution:** MTO eligibility and pricing are authoritatively sourced from Prisma, overriding Sanity if conflicts exist.
2. **MTO Cart Isolation:** MTO products cannot enter the normal cart; attempts are rejected server-side.
3. **Direct Buy Flow:** MTO uses a dedicated, isolated checkout UI and API.
4. **Customer Note:** Captured independently as a free-text string. (Structured Product Configuration is NOT supported in Slice 2).
5. **Idempotency:** UI duplicate-click mitigation is implemented using existing client-side submission protection. True server-side idempotency is NOT claimed in Slice 2 and remains a documented architectural gap requiring a future approved schema/architecture change.
6. **Financial Integrity:** Unit price, Product subtotal, Shipping charge, Coupon/discount result, and Final order total are calculated purely server-side.
7. **Required Advance:** Initialized server-side in DB as exactly `Final MTO Order Total × 50%`.
8. **Lifecycle Compatibility:** MTO Order successfully initiates in `PENDING_ADVANCE` state.
9. **Lead Time:** `estimatedManufacturingDays` is accurately calculated and snapshotted.
10. **Normal Checkout:** Existing Available Product purchasing remains unaffected.

---

**Revision 3 completed.**
**Architectural questions resolved.**
**Remaining Unresolved Issue:** Real server-side idempotency and structured product configuration require future dedicated schema/architecture approvals before production-grade network-retry protection and complex variant capabilities are claimed.
**Exact document path:** `d:\rootgrain website\_extracted\docs\approvals\0033-phase6-mto-slice2-checkout-approval.md`
**Status = AWAITING APPROVAL**
