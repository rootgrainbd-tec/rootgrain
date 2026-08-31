# ROOTGRAIN — PHASE 5A
# ADMIN PAYMENT OPERATIONS SPECIFICATION

**Document:** `docs/approvals/0019-phase5a-admin-payment-operations-specification.md`
**Status:** APPROVED

## 1. Business Objective
To provide the minimum viable operational interface for the newly deployed Phase 5 Payment Ledger. This micro-phase bridges the gap between the deployed backend ledger and the `Unified Admin Order Management` (Phase 8), allowing administrators to manually record and view payments for live orders without waiting for Phase 8.

## 2. Target Architecture
The implementation will introduce new Server Actions and React Server Components (RSC) to interface with the existing `PaymentService`.
- **API Boundary:** Next.js Server Actions (e.g., `src/app/actions/payment.admin.ts`) will act as the authenticated gateway. The Server Action is NOT an authorization replacement; it serves strictly for input validation + delegation.
- **Service Layer:** Actions will delegate directly to the existing `PaymentService.recordPayment(...)`.
- **UI Layer:** A new `PaymentLedger` component will be added to the existing Admin Order Details page (`src/app/(storefront)/admin/orders/[id]/page.tsx`).

## 3. Financial Validation Authority
- **Strict Server Authority:** Client-side checks are UX-only. The Server Action performs input validation and delegation. `PaymentService.recordPayment()` is the authoritative financial mutation boundary and performs authoritative financial validation and mutation.
- **Untrusted Client Inputs:** The client MUST NOT control `advancePaid`, `balanceDue`, `total paid`, or `recordedById`. Client-supplied actor identity is NEVER TRUSTED. The `recordedById` MUST be server-derived from `session.user.id`.

## 4. Payment Method & Type Contracts

### 4.1 Payment Method Rules
Phase 5A strictly consumes the exact existing Phase 5 `PaymentMethod` enum values. 0019 MUST NOT invent or rename payment methods.
- **Digital Methods:** `MANUAL_BKASH`, `BANK_TRANSFER`.
- **Non-Digital Methods:** `COD`, `CASH`, `OTHER`.

### 4.2 Reference Validation
- **For digital methods:** `reference` is **REQUIRED** according to the existing Phase 5 `PaymentReferenceClaim` contract.
- **For non-digital methods:** `reference` is **OPTIONAL / NOT REQUIRED**.
- The Server Action must normalize (e.g., trim) and validate the reference according to the existing `PaymentService` contract. Do NOT create fake references for `CASH`. Do NOT redefine `PaymentReferenceClaim`.

### 4.3 Payment Type / Method Matrix
The UI MUST only offer valid combinations, and the Server Action MUST independently reject invalid combinations:
- **Type `ADVANCE`:** Valid Methods -> `MANUAL_BKASH`, `BANK_TRANSFER`, `CASH`, `OTHER`. (Invalid: `COD`)
- **Type `INSTALLMENT`:** Valid Methods -> `MANUAL_BKASH`, `BANK_TRANSFER`, `CASH`, `OTHER`. (Invalid: `COD`)
- **Type `COD`:** Valid Methods -> `COD`, `CASH`. (Invalid: `MANUAL_BKASH`, `BANK_TRANSFER`, `OTHER`)

## 5. Idempotency Lifecycle
Phase 5A preserves the existing Phase 5 idempotency contract. The UI and Server Action must adhere to the following lifecycle without redefining the backend idempotency model:
- **New payment:** Generates a new idempotency key on the client.
- **Same business submission retry:** Reuses the same idempotency key.
- **Successful submission:** The form resets and receives a new idempotency key.
- **Idempotency conflict:** The same key remains available for safe resolution/retry according to existing `PaymentService` behavior.

## 6. Error Handling
The Server Action must return typed, user-facing outcomes without leaking internal database errors or sensitive information. Expected error states include:
- `UNAUTHORIZED` (Missing or insufficient session privileges)
- `INVALID_AMOUNT` (Amount <= 0)
- `AMOUNT_EXCEEDS_BALANCE` (Amount + advancePaid > total)
- `INVALID_PAYMENT_METHOD` (Method not in enum)
- `INVALID_TYPE_METHOD_COMBINATION` (Violates the matrix in section 4.3)
- `MISSING_DIGITAL_REFERENCE` (Digital method missing reference)
- `DUPLICATE_REFERENCE` (Reference already claimed)
- `IDEMPOTENCY_CONFLICT` (Duplicate idempotency key detected)
- `ORDER_CANCELLED` (Cannot pay for cancelled order)
- `ORDER_REJECTED` (Cannot pay for rejected order)
- `UNEXPECTED_SERVER_ERROR` (Generic fallback)

## 7. UI Refresh Semantics
After a successful payment recording:
- authoritative server result returned
- affected Order Details data refreshed/revalidated
- Payment History updated
- financial summary updated
- no browser-level full-page reload required

## 8. RBAC / Permissions Alignment
In explicit alignment with the approved `docs/approvals/0020-phase5a-rbac-authorization-decision.md` (Option A):
- **Authorization:** Authenticated session + `ADMIN` role.
- **Payment mutation authority:** `PaymentService.recordPayment()`.
- Phase 5A MUST NOT introduce `PAYMENT_RECORD` or any new granular permission. No `auth.ts` permission hydration. No RBAC migration.
- **RBAC Limitation:** Phase 5A intentionally uses coarse-grained ADMIN authorization. Any authenticated ADMIN currently has payment-recording authority. This is a known temporary limitation. Granular financial authorization is deferred to Canonical Phase 8.

## 9. Audit Visibility
Phase 5A may **READ** and display existing `OrderEvent`, `PaymentRecord`, `OrderDocument`, and `NotificationOutbox` entities. Phase 5A MUST NOT introduce a new audit/event model or redefine existing ones.

## 10. Scope Protection & Out-of-Scope Enforcement
Phase 5A includes: Admin Order Details payment visibility, payment history, payment recording UI, thin Server Action, existing PaymentService reuse, idempotency handling, financial summary display, and appropriate error handling.

The following are explicitly prevented in Phase 5A and DO NOT ADD to the scope:
- `PAYMENT_RECORD` permission
- granular RBAC
- refund
- reversal
- void
- price revision
- advance revision
- full order management
- MTO (Phase 6)
- Custom Order (Phase 7)
- Phase 8 functionality

## 11. No Database Change Hard Gate
- **Schema:** UNCHANGED
- **Migration:** NONE
- **Database:** UNCHANGED
This remains a hard gate for Phase 5A. The database contract is absolutely frozen.

## 12. Acceptance Criteria
1. An authorized Admin can view the payment ledger and financial summary.
2. An unauthorized actor cannot mutate the ledger (Server Action rejects).
3. A valid payment can be successfully recorded.
4. An invalid payment (e.g., amount <= 0, or exceeds balanceDue) is rejected by the Server Action.
5. A digital reference is strictly required for digital payment methods.
6. Cash/non-digital methods do not require, and do not receive, fake references.
7. A duplicate network submission remains idempotent and does not create duplicate payment records.
8. An invalid Payment Type / Payment Method combination is independently rejected by the Server Action.
9. All financial values (total, balanceDue) come authoritatively from the backend; client-supplied financial totals are ignored.
10. The ledger and summary UI refreshes automatically after a successful success response.
11. No full browser reload is required after a successful submission.
12. No schema modifications or migrations are created.
13. The existing `PaymentService` backend contract remains completely unchanged.

## 13. Final Classification
This specification resolves all identified implementation ambiguities and is fully aligned with ADR 0020.

**STATUS:** READY FOR HUMAN APPROVAL
