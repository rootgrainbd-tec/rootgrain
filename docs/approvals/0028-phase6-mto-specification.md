# 0028 Phase 6: MTO Specification

**Status:** DRAFT — AWAITING HUMAN APPROVAL

## 1. Executive Summary
This specification defines the architectural and technical blueprint for RootGrain Phase 6 (Make-to-Order Engine). It establishes a standard catalog MTO workflow that cleanly separates MTO purchases from custom bespoke inquiries (Phase 7). It introduces a canonical Prisma MTO representation, mixed-cart separation, advance payment prerequisites, and a decoupled production state machine, while strictly adhering to the frozen Phase 5 financial contracts.

## 2. Authoritative Sources
1. Original RootGrain Roadmap (Phase 6 Definition).
2. `0026-phase6-mto-pre-specification-reconnaissance.md` (Architectural findings).
3. `0027-phase6-mto-architectural-decisions.md` (Approved Business Decisions).

## 3. Roadmap Alignment
- **MTO Engine**: Implements catalog-driven Make-to-Order capability via standard checkout.
- **State Decoupling**: Fully separates operational `TrackingState` from workshop `ProductionState`.
- **Workshop Operations**: Establishes the admin production confirmation workflow based on financial eligibility.

## 4. Business Rules
1. **Lead Time**: Default 15 days (configurable). Represents estimated manufacturing time excluding delivery. Independent of quantity.
2. **Mixed Cart**: Available and MTO items may coexist in the cart, but checkout MUST generate separate orders.
3. **MTO Advance**: Default is 30% of the MTO order total, but final agreed advance is order-specific and retained historically.
4. **Production Confirmation**: Blocked until `advancePaid >= requiredAdvance`. Requires manual authorized Admin confirmation.

## 5. MTO Domain Model
Phase 6 (MTO) is strictly bounded to standard catalog products with predefined configurations and known manufacturing lead times. It differs fundamentally from Phase 7 (Custom Requests), which involves bespoke dimensions, manual quotations, and the `InquiryDialog`. Phase 6 flows entirely through the standard e-commerce cart.

## 6. Canonical MTO Representation
**Selected Representation: Option A (`isMto` + `leadTimeDays`)**
To prevent information loss during Sanity-to-Prisma sync, Prisma will natively track MTO characteristics. 
- The schema will introduce `isMto Boolean @default(false)` and `leadTimeDays Int?`.
- This preserves the standard boolean `inStock` for cart eligibility while cleanly isolating MTO domain logic.

## 7. Product Data Model
**Proposed Prisma Changes:**
```prisma
model Product {
  // Existing fields...
  isMto         Boolean @default(false)
  leadTimeDays  Int?    @default(15)
}
```

## 8. Order / OrderItem Snapshot Model
Historical orders must retain MTO conditions independently of future product catalog changes.
**Proposed Prisma Changes:**
```prisma
model OrderItem {
  // Existing fields...
  isMto         Boolean @default(false)
  leadTimeDays  Int?
}
```
**Order Model:** No schema changes required for the advance. The existing `requiredAdvance Int @default(0)` field on the `Order` model will now be properly populated at checkout time (e.g., set to 30% of total) to serve as the historical snapshot of the final agreed advance.

## 9. Advance Financial Model
- The Phase 5 Payment architecture (`PaymentService`, `PaymentRecord`, `PaymentReferenceClaim`, Idempotency) is **FROZEN**.
- The `Order.requiredAdvance` field represents the authoritative financial snapshot for production clearance.
- **Initial Setup**: Checkout computes `requiredAdvance = Math.floor(total * 0.30)` for MTO orders. 
- **Negotiation**: Admins can update `requiredAdvance` via a server action if business discussions yield a different percentage (e.g., 20%). The customer cannot modify this.

## 10. Cart / Checkout Model
MTO products behave like standard products in the cart but render distinct UI elements (e.g., "Made to Order (15 Days)"). Checkout routes them through the standard validation and payment selection UI.

## 11. Mixed Order Transaction Model
If a checkout payload contains both Available and MTO items, the backend transaction MUST split them into two separate `Order` entities to prevent fulfillment collisions.
- **Sequence**: Transactionally create `Order A` (Available items) and `Order B` (MTO items).
- **Atomicity**: Both orders are created in a single Prisma `$transaction`. If either fails, both rollback.
- **Customer Facing**: The frontend will present the user with two Order Numbers (e.g., `RG-20260822-123456` and `RG-20260822-123457`).
- **Payment Association**: Each order manages its own `requiredAdvance`, `advancePaid`, and `balanceDue`. Payments are recorded per-order using Phase 5 systems.

## 12. ProductionState Model
Represents the workshop/manufacturing lifecycle.
- **Customer Visible**: Implicitly affects tracking, but mostly for internal operations.
- **Admin/Workshop Visible**: Yes.
- **States**: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETE`.

## 13. TrackingState Model
Represents the operational/logistics lifecycle.
- **Customer Visible**: Yes.
- **States**: `PENDING_PRODUCTION`, `IN_PRODUCTION`, `QUALITY_CHECK`, `DISPATCHED`, `OUT_FOR_DELIVERY`, `DELIVERED_AND_COLLECTED`.
- **Independence**: `TrackingState` acts as the customer-facing proxy for `ProductionState` but transitions independently (e.g., `QUALITY_CHECK` can happen while production is technically `COMPLETE`).

## 14. State Transition Matrix
**ProductionState:**
- `NOT_STARTED` → `IN_PROGRESS` (Triggered by Admin upon financial eligibility).
- `IN_PROGRESS` → `COMPLETE` (Triggered by Admin/Workshop upon completion).

**TrackingState:**
- `PENDING_PRODUCTION` → `IN_PRODUCTION` (Can be auto-synced or manually triggered when ProductionState starts).

## 15. State Invariants
Contradictory state combinations MUST be blocked by backend service logic:
- `ProductionState == IN_PROGRESS` && `TrackingState == DISPATCHED` (INVALID).
- `ProductionState == NOT_STARTED` && `TrackingState == IN_PRODUCTION` (INVALID).
- `ProductionState != COMPLETE` && `DeliveryState == OUT_FOR_DELIVERY` (INVALID).

## 16. Production Confirmation Workflow
1. **Eligibility Check**: Server verifies `advancePaid >= requiredAdvance`.
2. **Rejection**: If false, throw `ValidationError("Required advance not met")`.
3. **Execution**: If true, transition `ProductionState = IN_PROGRESS`.
4. **Security**: Never trust client-supplied financial values. All checks read fresh from DB.
5. **Idempotency**: Duplicate clicks return successfully if state is already `IN_PROGRESS`.

## 17. OrderEvent Model
- Production transitions (`NOT_STARTED` → `IN_PROGRESS`, `IN_PROGRESS` → `COMPLETE`) MUST generate an `OrderEvent` record.
- **Event Types**: `PRODUCTION_STARTED`, `PRODUCTION_COMPLETED`.
- **Actor**: The authenticated `ADMIN` user ID.
- **Idempotency**: Prevent duplicate events via Prisma constraints or deterministic hashing.
- **Purpose**: Phase 9 will consume these for notifications. No emails are sent in Phase 6.

## 18. Admin Authorization
The existing `ADMIN` role is fully authorized to transition production states and modify the `requiredAdvance` value. No new granular roles (`PRODUCTION_MANAGER`, etc.) will be introduced in Phase 6.

## 19. Sanity Sync Contract
The `sync.service.ts` will explicitly map:
- `Available` → `inStock: true`, `isMto: false`, `leadTimeDays: null`
- `Made-to-Order` → `inStock: true`, `isMto: true`, `leadTimeDays: sanity.leadTimeDays || 15`
- `Sold` → `inStock: false`, `isMto: false`, `leadTimeDays: null`

## 20. Product / Cart Eligibility
MTO products MUST allow the "Add to Cart" action. The UI logic (`ProductActions.tsx`) must be updated to not treat MTO items as unavailable. An item is only unavailable for purchase if `inStock == false`.

## 21. Quantity Semantics
`leadTimeDays` represents the estimated duration for the entire order batch. It is NOT multiplied by quantity. Production planning impacts of large quantities are internal operational matters, not systemic formulas.

## 22. Idempotency
- **Checkout**: Leverages existing idempotency tokens.
- **Production Confirmation**: Server actions must handle rapid double-clicks securely by checking the current state before committing transactions.

## 23. Error Handling
- **Financial Validation**: Attempts to start production without funds yield a clear 400 Bad Request with a human-readable message.
- **State Validation**: Invalid transitions yield a 409 Conflict.
- **Mixed Cart Failure**: If splitting a cart fails, the entire transaction rolls back via Prisma `$transaction`.

## 24. UI Requirements
- **Product Page**: Remove `<InquiryDialog>` for MTO. Render `<AddToCart>` with "Made to Order (X Days)" label.
- **Cart/Checkout**: Indicate which items are MTO and require separate orders.
- **Admin Order Details**: Add "Start Production" button (disabled if advance unmet). Allow authorized edit of `requiredAdvance`.

## 25. Testing Requirements
Authoritative framework: **Vitest**.
- **Unit Tests**: MTO lead time mapping, invariant checks.
- **Integration Tests**: Mixed-cart checkout transaction (verifying 2 orders created), production confirmation financial gating.
- **Idempotency/RBAC Tests**: Ensure double-clicks and non-admin attempts are rejected securely.

## 26. Non-Functional Requirements
- **Transaction Integrity**: All order creation and state transitions must be strictly ACID compliant.
- **Financial Authority**: Client-side inputs for pricing, advances, or balances must be strictly ignored. DB truth is absolute.
- **Backward Compatibility**: Existing orders must not break when the new `isMto` field is added to Prisma.

## 27. Migration / Data Compatibility Plan
- The database migration will add `isMto` and `leadTimeDays` with defaults (`false` and `null` respectively).
- No data backfill is strictly required, as historical orders represent fulfilled catalog states.

## 28. Phase Boundaries
- **Phase 6**: MTO workflows, cart changes, advance gating, production states.
- **Phase 7 (Out of Scope)**: Custom Request quotations, bespoke design logic.
- **Phase 9 (Out of Scope)**: Sending emails upon production events.
- **Phase 11 (Out of Scope)**: Courier integration, shipping scheduling.

## 29. Risks
- Splitting a mixed cart into two orders creates UX friction if the user expects one unified confirmation screen and payment session. The UI must clearly articulate this division.

## 30. Acceptance Criteria
1. Sanity `Made-to-Order` status correctly syncs to Prisma `isMto=true` and `inStock=true`.
2. MTO products can be added to the cart and purchased normally.
3. MTO lead time is displayed accurately on the product page and checkout.
4. A mixed cart correctly splits into an Available Order and an MTO Order upon checkout.
5. `requiredAdvance` snapshots at exactly 30% of the MTO order total at checkout.
6. Admins can successfully negotiate/update the `requiredAdvance` field on an order.
7. Existing historical orders do not morph if a product changes from MTO to Available.
8. Production confirmation strictly blocked if `advancePaid < requiredAdvance`.
9. Production confirmation successfully transitions state to `IN_PROGRESS` if `advancePaid >= requiredAdvance`.
10. Only `ADMIN` roles can execute the production confirmation.
11. State transitions generate corresponding `OrderEvent` records.
12. Invalid state transitions (e.g., `IN_PROGRESS` while `DISPATCHED`) throw robust errors.
13. `PaymentService` architecture remains entirely unchanged.
14. Custom Request (`InquiryDialog`) workflow is not accidentally damaged for non-catalog items.

## 31. Implementation Slices
1. **Slice 1: Database & Sync Migration** (Update Prisma schema, modify `sync.service.ts`).
2. **Slice 2: Frontend Product Eligibility** (Update `ProductActions.tsx` and Cart UI for MTO support).
3. **Slice 3: Checkout Re-architecture** (Modify `CheckoutService` to handle split mixed-carts and `requiredAdvance` snapshots).
4. **Slice 4: Admin Production Controls** (Implement server actions and UI for advance negotiation and production state transitions).

*Note: Do not implement any slice until this specification is explicitly approved.*

## 32. Explicit Out-of-Scope
- Custom Order quotations and bespoke design workflows.
- Notifications or emails based on production events.
- Modifying the underlying payment architecture.
- Final-mile delivery tracking.

## 33. Approval Gate
This specification requires explicit human approval before any implementation slice may begin.

==================================================
**FINAL CLASSIFICATION:**
PHASE 6 SPECIFICATION COMPLETE — AWAITING APPROVAL
==================================================
