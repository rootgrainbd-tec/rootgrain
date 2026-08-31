# Phase 3 — Shipping Calculation Engine

## Current Architecture
1. **Product Data:** Authored in Sanity, synced to PostgreSQL via `SyncService` (`upsertProductBySanityId`), and stored in the Prisma `Product` table. Currently, `shippingType` is in Sanity but not synced to PostgreSQL.
2. **Checkout Frontend (`CheckoutPage`):** Fetches legacy district-based `ShippingRate`s from `/api/shipping` and calculates shipping entirely on the client side based on `selectedDistrict`.
3. **Checkout Backend (`CheckoutService.processCheckout`):** Receives cart items and `district`, fetches the legacy `ShippingRate` for the district, recalculates the total, and saves the final `shippingCost` to the `Order` table.

## Exact Files That Need Modification

### [MODIFY] `prisma/schema.prisma`
- Add `shippingType String?` to the `Product` model. This is strictly to support the existing architecture where `Product` acts as a relational cache for Sanity, preventing N+1 API queries during checkout.

### [MODIFY] `src/services/sync.service.ts`
- Update the Sanity GROQ query to include `shippingType`.
- Map `shippingType` into the `create` and `update` payloads in `ProductRepository.upsertProductBySanityId`.

### [MODIFY] `src/repositories/product.repository.ts`
- Update `upsertProductBySanityId` to accept and save `shippingType`.

### [NEW] `src/services/shipping-engine.service.ts`
- Create a dedicated utility class `ShippingEngine` to implement the new Nationwide calculation logic.
- Takes cart items (with `shippingType` and `quantity`) and active `ShippingTypeRate`s.
- Outputs the final `shippingCost`.
- Throws safe validation errors if an item is missing a `shippingType` or a rate configuration.

### [NEW] `src/app/api/checkout/shipping-preview/route.ts`
- Create a new POST endpoint for the frontend to securely calculate shipping costs based on cart items without leaking raw calculation logic to the client.

### [MODIFY] `src/app/(storefront)/checkout/page.tsx`
- Remove the legacy `/api/shipping` client-side calculation.
- Add an effect to query `/api/checkout/shipping-preview` with cart item IDs when the cart mounts.
- Retain Division/District fields solely for the delivery address logic, decoupling them from shipping costs.

### [MODIFY] `src/services/checkout.service.ts`
- Replace `ShippingRepository.getShippingRateByDistrict(district)` with a call to the new `ShippingEngine.calculate()`.
- The final authoritative `shippingCost` is saved safely into the `Order`.

## Exact Proposed Changes

### Product `shippingType` Retrieval Method
The Sanity Product is the source of truth. We will extend the existing `SyncService` to extract `shippingType` from Sanity and map it into the Prisma `Product` model. The `CheckoutService` already queries the `Product` model to validate prices and stock; it will now simultaneously retrieve the `shippingType` without requiring additional API requests.

### Calculation Algorithm (Shipping Engine)
1. Group cart items by `shippingType`, aggregating quantities.
2. Determine if a "Large" type (`medium`, `large`, `bulky`) exists in the cart.
3. If a "Large" type exists, set the charges for `small_1` and `small_2` to `0` (FREE).
4. For all remaining types (including Small types if no "Large" types exist), calculate:
   `Type Cost = Base Charge + (Additional Charge * (Quantity - 1))`
5. Sum all calculated type costs to get the final `shippingCost`.

### Server-Side Validation Strategy
- The frontend will rely on a new `/api/checkout/shipping-preview` endpoint. It will never send a raw `shippingCost` to the server during checkout.
- The `CheckoutService` acts as the supreme authority. It recalculates the final cost internally using the database's `ShippingTypeRate` configurations and the Prisma `Product` cache, ignoring any client assumptions.

### Order Persistence Strategy
- The `Order` table already has a `shippingCost: Int` column. This remains unchanged. The backend `CheckoutService` will persist the engine-calculated amount into this column exactly as it does today.
- Legacy `ShippingRate` data and District fields will not be deleted in this phase.

### Missing Configuration (Error / Fallback Behavior)
> [!IMPORTANT]
> If a product lacks a `shippingType`, or if the Admin has not configured a rate for a required type, the Shipping Engine will throw a `ValidationError` (HTTP 400). This intentionally blocks checkout for that cart rather than silently charging 0 or guessing a default amount, protecting against financial loss.

## Test Plan
- Create a unit/integration test suite or manual test matrix matching the 10 tests specified in the requirements.
- Verify that `Small 1` and `Small 2` correctly drop to `0` when `Medium`/`Large`/`Bulky` are present.
- Verify quantities increment using the `Additional Charge`.
- Verify the checkout form succeeds with various Divisions/Districts, generating identical nationwide shipping costs.

## Risks
- **Data Sync Lag:** If a product's `shippingType` is updated in Sanity, the Prisma cache must sync. The existing webhook architecture already handles this, but it must be functioning correctly.
- **Missing Data:** Existing Sanity products might not have a `shippingType` assigned yet (since Phase 1 was just completed). Checkout will be blocked for these products until the Admin updates them.

## Rollback Plan
- The legacy `ShippingRate` table remains intact.
- Reverting the commits for Phase 3 will immediately restore the client-side `/api/shipping` district-based calculation and the backend's dependency on `ShippingRepository.getShippingRateByDistrict()`.
