# ROOTGRAIN — PHASE 6 — SLICE 3
ADMIN MTO WORKFLOW + ADVANCE CONTROL
APPROVAL DOCUMENT — REVISION 3
==================================================

## Objective
This document outlines the architectural specifications and implementation plan for Phase 6 Slice 3: Admin MTO Order Workflow. The scope includes Admin confirmation, Required Advance negotiation, payment deadlines, order expiry, address correction, and internal notes.

## Status
**AWAITING APPROVAL**

==================================================
## 1. Existing Architecture Findings & Gaps
==================================================
During the deep repository audit, the following critical architectural realities were discovered:

- **Invoice Engine Boundary**: `InvoiceService` is not currently integrated with `OrderService`. Setting `Order.status = CANCELLED` is the authoritative Order lifecycle transition, but it does NOT perform a real Invoice/Accounting state transition. The storefront invoice page simply renders `Order.status`. We must NOT claim that `Order.status = CANCELLED` automatically means `Invoice.AccountingStatus = CANCELLED`. True Invoice/Accounting state synchronization is explicitly OUT OF SCOPE for Slice 3.
- **Admin Confirmation Gap**: Currently, the Admin UI confirms standard orders by directly updating `Order.advancePaid` via `updateOrderStatus`. This completely bypasses the authoritative Phase 5 Payment Ledger (`PaymentService.recordPayment`).
- **Expiry Infrastructure Gap**: There is no existing background job architecture configured in `vercel.json`. However, a cron-like structure exists for `abandoned-cart` which uses a secure `CRON_SECRET` bearer token validation pattern.
- **Address Audit**: The `OrderEvent` model exists and is well-suited for logging address corrections and Admin actions, avoiding the need for a new audit table.
- **AdminInternalNote**: The `AdminInternalNote` Prisma model exists but currently has no UI or server actions.

==================================================
## 2. Concurrency & Transaction Mechanisms (VERIFIED)
==================================================
The `PaymentService` (`src/services/payment.service.ts`) relies on **PostgreSQL Row-Level Locking** to guarantee race safety. Specifically, it executes:
`SELECT * FROM "Order" WHERE id = ${orderId} FOR UPDATE`
inside a `prisma.$transaction`.

Therefore, Slice 3 expiry and Required Advance modification MUST use the identical Order row-level lock before checking Payment Ledger state:

**Required Advance Concurrency**:
1. `FOR UPDATE` lock on Order
2. Verify exactly zero `PaymentRecord` entries
3. Update `requiredAdvance`
4. Reset `advanceDeadline`
5. Commit

**Expiry Concurrency**:
1. `FOR UPDATE` lock on Order
2. Verify `advanceDeadline` passed
3. Verify exactly zero `PaymentRecord` entries
4. Set `Order.status = CANCELLED`
5. Commit

If `PaymentService` cannot acquire the lock before the transaction commits, it will observe the resulting state, preventing an invalid concurrent payment/expiry transition. `PaymentService` itself will NOT be modified in Slice 3.

==================================================
## 3. Scope
==================================================
### In-Scope for Slice 3
- Admin MTO visibility (identifying MTO orders in the Admin list).
- Admin Confirmation (separating confirmation from payment recording).
- Required Advance negotiation (strictly before the first payment).
- Payment Deadline configuration (48 hours).
- MTO Expiry handling (zero payment vs. partial payment via Vercel Cron).
- Manual Admin Expiry Fallback.
- Admin Internal Notes (CRUD).
- Address Correction with audit trail via `OrderEvent`.
- RBAC using existing `Role.ADMIN`.
- Payment Ledger-safe concurrency.

### Out-of-Scope (Future Slices)
- **Invoice/Accounting synchronization (Explicit Future Dependency)**
- Manufacturing state transitions (e.g., `ProductionState` management).
- Delivery/Tracking updates.
- Customer-facing payment gateways.
- Refactoring the legacy Standard Order payment flow.
- New RBAC architecture.

==================================================
## 4. Admin Workflow
==================================================
### MTO Order Admin Visibility
- **List View**: Reuse `OrdersTable.tsx`. MTO orders will be identified by a badge (`MTO`). The table will display `Required Advance` instead of just `Advance Paid` for MTO orders.
- **Order Detail**: Add sections for `Admin Internal Notes`, `Payment Deadline`, and `Required Advance` negotiation.

### Admin Confirmation
- **Transition**: Customer submits -> `PENDING_ADVANCE`. Admin reviews -> clicks "Confirm" -> transitions to `CONFIRMED`.
- **Payment Bypass**: This action must **NOT** record a payment. It simply confirms the order and sets the `advanceDeadline`.

### Required Advance Negotiation & Deadline Reset
- **Rule**: Admin may adjust the `requiredAdvance` (default 50%) **BEFORE** the first payment.
- **Deadline Reset**: If the Admin changes the Required Advance, the `advanceDeadline` is reset. The new deadline becomes the modification timestamp + 48 hours.
- **Validation**: Once a `PaymentRecord` exists (authoritative server-side check), the `requiredAdvance` is strictly locked. 
- **Value Range**: Cannot be negative. Cannot exceed `Order.total`. 
- **Audit**: Every valid modification creates an `OrderEvent`.

### Payment Deadline
- **Field**: `Order.advanceDeadline`.
- **Duration**: **48 HOURS**.
- **Calculation**: Set to `confirmation timestamp + 48 hours` or `modification timestamp + 48 hours` (if advance is changed).
- **Timezone**: Must use the existing application/database timezone conventions without hard-coded assumptions.

### Expiry Mechanism & Rules
- **Primary Mechanism**: A Vercel Cron job running **HOURLY**.
- **Fallback Mechanism**: A manual Admin "Mark Expired" action.
- **Eligibility Validation**:
  - `isMtoOrder = true`
  - Status is eligible for expiry.
  - `advanceDeadline < current server time`
  - Payment Ledger shows exactly zero `PaymentRecord` entries.
- **Partial Payment Suppression**: If `advancePaid > 0` according to the Payment Ledger, DO NOT expire. Automatic expiry is strictly suppressed.

### Cron Security
- **Authentication**: The internal expiry endpoint MUST NOT be publicly executable.
- **Mechanism**: Reuse the existing `CRON_SECRET` bearer token validation pattern found in `abandoned-cart/route.ts`.

### Admin Internal Notes
- **Capabilities**: CRUD operations.
- **Visibility**: Strictly gated by `Role.ADMIN`. Must never be exposed to the customer or on the invoice.
- **Model**: Reuse existing `AdminInternalNote`.

### Address Correction
- **Capabilities**: Admin can update the JSON `shippingAddress`.
- **History**: The previous address is preserved via an `OrderEvent`.
- **Constraints**: Does NOT recalculate shipping costs, manufacturing estimates, or payment deadlines.

==================================================
## 5. Explicit Future Dependency: Invoice Integration
==================================================
**FUTURE: Invoice / Accounting State Synchronization**
The Slice 3 implementation MUST NOT pretend that the existing Invoice Engine automatically synchronizes state. A future design phase must determine:
- `InvoiceService` integration.
- `AccountingRepository` implementation.
- `AccountingStatus` mapping.
- Cancellation/void semantics and payment interaction.

For Slice 3, the customer-facing invoice may display `CANCELLED` directly from `Order.status`, but the system makes no claim that this represents a complete Invoice Engine state transition.

==================================================
## 6. Acceptance Criteria
==================================================
### Confirmation
- Admin confirms MTO.
- No payment is recorded.
- 48-hour deadline is created.
- Status transition is correct (`CONFIRMED`).

### Advance
- Default advance is 50%.
- Admin can modify before the first `PaymentRecord` exists.
- Cannot modify after the first `PaymentRecord` (strictly locked).
- Every modification is audited via `OrderEvent`.
- Deadline resets to modification timestamp + 48 hours.
- Modification race safety is guaranteed via `FOR UPDATE` lock.

### Expiry
- Vercel Cron runs hourly.
- Targets only overdue MTO orders.
- **On valid MTO expiry, `Order.status` is transactionally changed to `CANCELLED`.** The current Invoice/Accounting architecture does not provide automatic Invoice accounting-state synchronization. Slice 3 does not implement that integration. The gap is explicitly tracked as a future approved Invoice/Accounting integration requirement.
- Partial payment suppresses automatic expiry.
- Transactional protection via `FOR UPDATE` lock guarantees no race conditions with `PaymentService`.
- Expired order cannot be reactivated.

### Notes
- Admin can perform full CRUD on `AdminInternalNote`.
- Customer cannot access internal notes.

### Address
- Admin correction works.
- Address history is preserved via `OrderEvent`.

### Security
- Admin authorization properly enforced (`Role.ADMIN`).
- Cron endpoint is protected via `CRON_SECRET` bearer token.

==================================================
## 7. Implementation Boundary
==================================================
This document remains **SPECIFICATION ONLY**.
- DO NOT modify application code.
- DO NOT modify Prisma schema.
- DO NOT create migrations.
- DO NOT modify `PaymentService`.
- DO NOT modify Invoice Engine.
- DO NOT modify RBAC.
- DO NOT modify Slice 2 code.

==================================================
STATUS: AWAITING APPROVAL
==================================================
