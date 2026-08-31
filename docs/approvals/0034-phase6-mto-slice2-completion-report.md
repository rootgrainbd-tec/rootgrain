# ROOTGRAIN — PHASE 6 SLICE 2
**MTO Customer Purchase Flow — Completion Report (Revision 1)**

## Status
**NEEDS REMEDIATION**

## Reason for Remediation
The database server at `localhost:54322` is completely unreachable (and `docker ps` is hanging). As a result, the required functional tests and financial integrity tests could not be executed.

---

## 1. Product Slug Contract Verification
**RESULT: VERIFIED**
The implementation uses `/checkout/mto?productId=${product.id}&qty=1`.
Inspection of `src/app/(storefront)/product/[slug]/page.tsx` (lines 165-175) confirms that `product.id` is explicitly populated with the Prisma Product slug:
```typescript
<ProductActions 
  product={{
    id: resolvedParams.slug, // Explicitly the Prisma slug
    name: name,
    price: price,
    ...
```
Therefore, `product.id` in `ProductActions.tsx` is demonstrably an alias for the Prisma slug. The approved architectural contract remains intact.

## 2. Files Changed
```
src/app/(storefront)/product/[slug]/page.tsx
src/components/product/ProductActions.tsx
src/store/useCartStore.ts
src/validations/mto-checkout.schema.ts      [NEW]
src/services/checkout.service.ts
src/app/api/checkout/mto/route.ts           [NEW]
src/app/(storefront)/checkout/mto/page.tsx  [NEW]
src/app/(storefront)/checkout/mto/MtoCheckoutClient.tsx [NEW]
```

## 3. Functional Tests & Financial Integrity
**RESULT: FAILED TO EXECUTE (Database Unreachable)**
A test script (`scratch/test-mto-checkout.ts`) was created to programmatically execute `CheckoutService.processMtoCheckout` and verify:
- MTO vs Available product restrictions
- Server-side pricing enforcement
- Coupon logic
- Shipping calculation
- Required Advance (50%)
- Lead Time calculation
- Order Snapshot and Customer Note

**Error:**
```
PrismaClientInitializationError: Can't reach database server at `localhost:54322`
```
These tests are blocked until the local database container is restored.

## 4. Normal Checkout Regression
**RESULT: FAILED TO EXECUTE (Database Unreachable)**
Regression tests for normal checkout could not be executed due to the database connection failure.

## 5. Build / Typecheck
**RESULT: PASSED**
`npm run build` completed successfully in 81s with 0 type errors. 
Note: The build only succeeded because it uses Prisma generate/build-time artifacts, but runtime logic remains blocked by the database.

## 6. Known Idempotency Limitation
**DOCUMENTED:**
True server-side idempotency does NOT exist in the current architecture. The current system and the new MTO flow rely entirely on **UI duplicate-click mitigation** (e.g. `isSubmitting` state disabling the submit button). This is explicitly noted and NOT equivalent to server-side idempotency.

## 7. Deviations from Revision 3
**None**. No new business rules were invented.

## Next Steps
The user must resolve the database unavailability (Docker container down / port 54322 unreachable) so that functional business-rule tests can be executed.
