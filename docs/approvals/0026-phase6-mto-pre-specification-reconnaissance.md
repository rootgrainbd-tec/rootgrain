# 0026 Phase 6: MTO (Make-to-Order) Pre-Specification Reconnaissance

**Status:** COMPLETED — AWAITING SPECIFICATION

## 1. Executive Summary
This document provides a deep, read-only architectural reconnaissance of the existing RootGrain repository to determine how Phase 6 (Make-to-Order) should be integrated. The key finding is a current architectural collision: the frontend treats MTO products as "Custom Requests" (hiding the Cart button and forcing an Inquiry), while the backend synchronization logic treats them as standard `inStock` products. Phase 6 must bridge this gap to allow MTO items to flow through standard checkout while triggering production workflows.

## 2. Existing Product Architecture
- **Sanity CMS (`sanity/schemas/product.js`)**: Natively supports MTO. It includes an `availability` enum (`Available`, `Made-to-Order`, `Sold`) and a `leadTimeDays` numeric field to estimate manufacturing time.
- **Backend Sync (`services/sync.service.ts`)**: Prisma's `Product` model lacks MTO awareness. The sync engine flattens Sanity's `availability` down to a single boolean: `inStock: availability != "Sold"`. As a result, MTO items are successfully synced to PostgreSQL, but are indistinguishable from regular stock (both are `inStock: true`).

## 3. Existing Order Architecture
- **Prisma Schema (`Order`)**: Contains native support for production workflows via `productionState` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETE`) and `trackingState` (which includes `PENDING_PRODUCTION`, `IN_PRODUCTION`, `QUALITY_CHECK`).
- **Checkout Flow (`CheckoutService`)**: Standard checkout creates an `Order` with defaults (`productionState = NOT_STARTED`). It does not inspect items for MTO flags (because the Prisma Product model lacks them) and does not adjust financial obligations like `requiredAdvance`.

## 4. Existing Customer Flow
- **Product Page (`product/[slug]/page.tsx`)**: The UI derives `isAvailable` by evaluating `product.availability === 'Available'`. If a product is MTO, `isAvailable` evaluates to `false`.
- **Add to Cart**: Because `isAvailable` is `false` for MTO items, the `<ProductActions>` component hides the "Add to Cart" button and instead renders an `<InquiryDialog>`.

## 5. Existing Admin Flow
- Admins currently manage order fulfillment and record payments (Phase 5). The backend schema supports `productionState`, but without MTO flags flowing from checkout to the Order, admins would have to manually identify MTO orders.

## 6. Current MTO Support
- **Supported**: Data entry in Sanity (`availability: 'Made-to-Order'`, `leadTimeDays`), and backend order state enums (`productionState`).
- **Missing**: Cart integration, checkout propagation, Prisma schema flags, and UI lead-time rendering. Currently, MTO relies on the Phase 7 "Custom Request" inquiry flow.

## 7. MTO Definition Evidence
Based on the repository state, an MTO product on RootGrain is defined as:
- A catalog product with a defined configuration (Wood Type, Dimensions, Price).
- It is NOT physically in inventory (stock is zero/irrelevant).
- It requires a production delay, defined by `leadTimeDays`.
- It currently operates at the **product-level** (not variant-level, as variants don't exist in the schema).

## 8. MTO vs Custom Request Boundary
**CRITICAL FINDING:** Phase 6 and Phase 7 are currently colliding.
- **Phase 6 (MTO)**: Should be for standard catalog products that just need to be manufactured. They should flow through the standard cart and checkout, yielding an `Order` with a `productionState`.
- **Phase 7 (Custom Request)**: Should be for the `<InquiryDialog>` where users ask for custom dimensions, custom woods, or completely bespoke designs that require manual quotation.
- **Current State**: Phase 6 products are being forced into the Phase 7 workflow.

## 9. Payment Impact
- **Current**: `requiredAdvance` defaults to `0` in Prisma.
- **MTO Implication**: MTO historically requires an advance payment before production begins. 
- **Finding**: Phase 5 Payment Ledger (recording payments) remains UNCHANGED. However, checkout might need to set `requiredAdvance` > 0 for orders containing MTO items.

## 10. Order State Impact
- **Impact**: Minimal schema change. MTO orders will natively utilize the existing `productionState` (`NOT_STARTED` -> `IN_PROGRESS` -> `COMPLETE`). 
- **Requirement**: An admin acknowledgement/trigger will likely be needed to transition `productionState` to `IN_PROGRESS`.

## 11. Inventory Impact
- **Current**: No quantitative stock counting exists; only a boolean `inStock`.
- **Impact**: No immediate change required to inventory logic, provided Prisma's `Product` model is updated to pass MTO intent so the frontend can differentiate it from actual out-of-stock items.

## 12. Pricing Impact
- **Finding**: MTO items have a fixed `price` in Sanity. There is no evidence of production surcharges or variant pricing.
- **Conclusion**: Pricing logic remains UNCHANGED.

## 13. RBAC Impact
- **Finding**: Admins will need to update `productionState`. Existing Admin RBAC is sufficient. No new roles required.

## 14. Documents/Communication Boundary
- **Phase 9 Dependency**: MTO orders logically require notifying the customer when production starts/ends.
- **Boundary Restriction**: Phase 6 must NOT implement these notifications. Phase 6 should only ensure the `productionState` changes are recorded as `OrderEvent`s, which Phase 9 will later use to trigger emails.

## 15. Shipping Boundary
- **Impact**: MTO delays shipping by `leadTimeDays`. However, shipping logic/delivery scheduling is out of scope for Phase 6. Phase 6 only needs to ensure the order doesn't enter `DeliveryState: OUT_FOR_DELIVERY` while `ProductionState` is incomplete.

## 16. Database Impact
**REQUIRES SCHEMA DECISION**
To detach MTO from the Custom Request flow, Prisma needs MTO awareness:
- `Product` needs `isMto Boolean @default(false)` and `leadTimeDays Int?`.
- `OrderItem` needs `isMto Boolean @default(false)` to snapshot the intent at checkout.

## 17. Testing Landscape
- **Framework**: Jest (`tests/`). 
- **Impact**: New integration tests will be needed for MTO checkout flows and Admin `productionState` updates.

## 18. Risks
1. **Scope Collision**: Leaking Phase 7 (Custom) quoting into Phase 6.
2. **Payment Ambiguity**: Checkout currently doesn't mandate an advance. If MTO requires an advance, checkout logic must change.
3. **Frontend Cart Re-architecture**: Moving MTO from `<InquiryDialog>` to standard `<AddToCart>` requires UI updates.

## 19. Required Decisions
- **DECISION 1**: Should MTO items be orderable through the standard cart? (Reconnaissance recommends YES, to separate from Phase 7).
- **DECISION 2**: Does an MTO order require a system-enforced `requiredAdvance` calculation at checkout, or is that a manual admin operational policy?
- **DECISION 3**: Should Prisma's `Product` and `OrderItem` models be expanded to include `isMto` and `leadTimeDays`?

## 20. Recommended Phase 6 Scope
- Expand Prisma `Product` to include `isMto` and `leadTimeDays` (mapped from Sanity).
- Update frontend to allow Add-to-Cart for MTO items, displaying "Made to Order (X Days)" instead of blocking checkout.
- Expand Prisma `OrderItem` to snapshot `isMto`.
- Provide Admin UI controls to transition `productionState` on the Order Ledger.

## 21. Explicit Out-of-Scope
- Custom Quotations / Bespoke dimensions (Phase 7).
- Customer email notifications for production updates (Phase 9).
- Delivery routing (Phase 11).
- Modifying Phase 5 Payment Record contracts.

## 22. Readiness for Phase 6 Specification
Reconnaissance is complete. The architectural gaps are identified. Once the Required Decisions (Section 19) are resolved, Phase 6 is ready for formal specification.

==================================================
**FINAL CLASSIFICATION:**
PHASE 6 RECONNAISSANCE COMPLETE — READY FOR SPECIFICATION
==================================================
