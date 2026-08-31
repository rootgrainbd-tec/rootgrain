# 0080-PHASE8-SLICE-ARCHITECTURE-APPROVAL

**Document:** docs/approvals/0080-phase8-slice-architecture-approval.md
**Status:** AWAITING APPROVAL

## 1. Phase 8 Objective
**UNIFIED ADMIN ORDER MANAGEMENT**
Deploy the complete suite of administrative financial mutations—Payment Voiding, Advance Revision, and Price Revision—secured by a hardened, granular RBAC (Role-Based Access Control) architecture. This replaces the temporary coarse-grained `ADMIN` authorization bridge deployed in Phase 5A.

## 2. Authoritative Source Documents
- `0008-phase3-repository-data-architecture-mapping.md`
- `0018-phase6-roadmap-sequence-decision-adr.md`
- `0019-phase5a-admin-payment-operations-specification.md`
- `0020-phase5a-rbac-authorization-decision.md`
- `0079-phase8-roadmap-and-first-slice-implementation-plan.md`

## 3. Why Official Slice Definitions Were Previously Missing
The Canonical Roadmap (`0008`, `0018`) successfully defined the overall *scope* of Phase 8 (deferring complex financial mutations and granular authorization to it), but did not subdivide the work into execution slices. Phase 8 existed as a conceptual boundary for "Unified Admin Order Management" without a step-by-step implementation plan. This document formally freezes the execution slices.

## 4. Proposed Slice Architecture
A 4-Slice dependency-driven sequence is adopted to ensure authorization is secured before financial mutations are introduced.
- **Slice 1:** RBAC Architecture & Session Hydration
- **Slice 2:** Payment Voiding & Granular Authorization
- **Slice 3:** Advance Revision
- **Slice 4:** Price Revision

## 5. Slice 1 Scope — RBAC FOUNDATION
**Objective:** Build the authorization foundation required by all later Phase 8 financial mutations.
- **Scope:**
  - `Permission`, `RolePermission`, and `UserPermission` models.
  - Permission definitions (e.g., `payment.record`, `payment.void`, `advance.revise`, `price.revise`).
  - Role → permission mapping.
  - User-specific permission overrides.
  - NextAuth permission hydration.
  - Server-side permission checking.
  - Replacement strategy for the coarse `ADMIN` authorization bridge.
- **Out of Scope:** Payment Voiding, Advance Revision, Price Revision, or any financial data mutations.

## 6. Slice 2 Scope — PAYMENT VOIDING
**Objective:** Enable administrators to void completed payments securely.
- **Scope:**
  - Payment voiding service.
  - Addition of `VOIDED` to `PaymentStatus` enum.
  - Granular authorization (`payment.void`).
  - OrderEvent / Payment event generation.
  - Admin UI for voiding payments.
  - Audit trail, idempotency, and concurrency safety.
  - Financial integrity (recalculation of `validPaid` and `balance`).
- **Out of Scope:** Advance Revision, Price Revision.

## 7. Slice 3 Scope — ADVANCE REVISION
**Objective:** Enable administrators to revise the Required Advance amount before production begins.
- **Scope:**
  - Revise required advance service.
  - Granular authorization (`advance.revise`).
  - Financial validation (blocking revisions after production starts).
  - Admin UI for Advance Revision.
  - Audit trail/event generation.
  - Idempotency and concurrency safety.
  - Impact recalculation on balance/payment state.
- **Out of Scope:** Price Revision.

## 8. Slice 4 Scope — PRICE REVISION
**Objective:** Enable administrators to revise the unit price of items.
- **Scope:**
  - `PriceRevision` model schema.
  - Price revision service.
  - Granular authorization (`price.revise`).
  - Financial recalculation (applicable payable, balance).
  - Admin UI for Price Revision.
  - Audit trail/event generation.
  - Idempotency and concurrency safety.
  - Historical price preservation.
- **Out of Scope:** Redesigning RBAC.

## 9. Dependencies
- **Slice 1** must be completed first as the mandatory authorization foundation.
- **Slice 2**, **Slice 3**, and **Slice 4** all strictly depend on **Slice 1**.
- **Independent Execution:** Slice 3 (Advance Revision) does *not* depend on Slice 2 (Payment Voiding). Slice 4 does *not* depend on Slice 2 or 3. They modify distinct financial constraints. However, the standard implementation sequence will be **1 → 2 → 3 → 4** for structured deployment, unless parallelized intentionally.

## 10. RBAC Prerequisite & Temporary Admin Bridge
Phase 8 MUST NOT simply replace `session.role === "ADMIN"` with another hardcoded role check. The target architecture uses exact granular permissions.
- **Current Bridge Locations:**
  - `src/services/payment.service.ts` (Payment recording)
  - `src/app/actions/custom-request.ts` (Custom Request handling)
  - `src/app/actions/payment.admin.ts`
  - `src/app/(storefront)/admin/orders/[id]/page.tsx`
- **Strategy:** Migration must preserve existing Admin functionality. The `session.role === "ADMIN"` bridge must NOT be removed prematurely until the new permission model is safely hydrated and applied.

## 11. Payment Boundary & Financial Mutations
Slice 1 establishes the authorization boundary. Slices 2, 3, and 4 each implement a strict, isolated financial mutation with atomic Idempotency, generating canonical `OrderEvent` snapshots and recalculating derived balances without destroying historical immutable records.

## 12. Database Impact
**Minimal Schema Design:**
- **RBAC:** 
  - `Permission` (id, name, description)
  - `RolePermission` (role, permissionId)
  - `UserPermission` (userId, permissionId)
- **Payment:** Update `PaymentStatus` enum to include `VOIDED`.
- **Pricing:** Create `PriceRevision` model (id, orderId, previousProductPrice, adjustment, newProductPrice, reason, actor).

*(No migrations will be generated during this specification phase).*

## 13. JWT / Session Hydration Impact
NextAuth (`src/lib/auth.ts`) must be updated to hydrate permissions. 
**Token Size Risk:** If the permission catalogue grows significantly, storing a large string array in the JWT may exceed cookie limits. 
**Alternative Strategy:** Rather than blindly storing a huge array, NextAuth can hydrate essential `role` context into the JWT, and critical Server Actions can query `prisma.rolePermission` / `prisma.userPermission` during the transaction, caching the result in the React request cache to minimize database load.

## 14. Explicit Out-of-Scope
- SMS/WhatsApp gateway integrations.
- Phase 6 (MTO) workflow modifications (QC, Dispatch).
- Modifying the existing NextAuth User model identity structure.

## 15. Risks
- **JWT Size Limit:** Exceeding cookie payload limits if too many permissions are hydrated into the token.
- **Premature Bridge Removal:** Locking Admins out of `PaymentService.recordPayment` or Custom Request conversions if the `ADMIN` bridge is removed before permissions are correctly seeded and hydrated.
- **Financial Concurrency:** Revisions and voids happening concurrently with active payments requiring robust row-locking (`FOR UPDATE`) in Prisma.

## 16. Approval Gate

==============================================================
STATUS: AWAITING USER APPROVAL
==============================================================
