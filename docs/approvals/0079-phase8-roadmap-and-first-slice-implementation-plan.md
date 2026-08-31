# 0079-PHASE8-ROADMAP-AND-FIRST-SLICE-IMPLEMENTATION-PLAN

**Document:** docs/approvals/0079-phase8-roadmap-and-first-slice-implementation-plan.md
**Status:** AWAITING APPROVAL

## 1. Authoritative Roadmap Source
The Canonical Roadmap for Phase 8 is derived from the following approved governance documents:
- **`0008-phase3-repository-data-architecture-mapping.md`**: Officially designates Phase 8 as "Unified Admin Order Management" and defers requirements ADV-003 (Advance Revision), PRC-002 (Price Revision), and AUT-001 (Authorization Matrix) to it.
- **`0018-phase6-roadmap-sequence-decision-adr.md`**: Confirms Phase 8 scope includes "Full Admin Order Management suite (Price Revisions, Advance Revisions, Voiding)".
- **`0019-phase5a-admin-payment-operations-specification.md`**: Explicitly defers granular financial authorization, Payment Voiding, Price Revision, and Advance Revision to Canonical Phase 8.
- **`0020-phase5a-rbac-authorization-decision.md`**: Mandates that Phase 8 MUST revisit the RBAC architecture and perform permission hydration before introducing granular payment permissions or new financial mutations.

## 2. Phase 8 Objective
**Objective:** Unified Admin Order Management.
Deliver the complete suite of administrative financial mutations (Payment Voiding, Advance Revision, Price Revision) secured by a hardened, granular RBAC (Role-Based Access Control) architecture. This replaces the temporary coarse-grained `ADMIN` authorization bridge deployed in Phase 5A.

## 3. Repository & Dependency Audit

### Prisma Schema (Database)
- **RBAC Models**: MISSING. `Permission`, `RolePermission`, and `UserPermission` models do not exist in `schema.prisma`.
- **Payment Status**: `VOIDED` is missing from the `PaymentStatus` enum.
- **Price Revision**: `PriceRevision` model is missing.
- **Event Types**: Handled at the application level as strings in `OrderEvent`.

### NextAuth (`src/lib/auth.ts`)
- **Session Hydration**: Currently only hydrates the `Role` enum (`USER`, `ADMIN`).
- **Dependency Impact**: NextAuth configuration requires significant modifications to hydrate a granular `permissions: string[]` array into the JWT session token without exceeding token size limits.

### Services (`src/services/payment.service.ts`)
- **Missing Core Logic**: Functions for `voidPayment`, `revisePrice`, and `reviseRequiredAdvance` are completely missing.
- **Authorization**: `PaymentService.recordPayment` currently relies on coarse-grained `session.role === "ADMIN"` checking instead of granular permissions.

### Admin UI (`src/app/(storefront)/admin/orders/[id]/`)
- **Missing Surfaces**: No UI surfaces exist for Price Revision, Advance Revision, or Payment Voiding.

## 4. Phase 8 Implementation Slices

> [!WARNING]
> **AMBIGUITY DETECTED: MISSING SLICE DEFINITIONS**
> The Canonical Roadmap (`0008`, `0018`, `0020`) defines the *scope* and *requirements* of Phase 8, but it does **NOT** officially define the implementation *slices*. 
> 
> Per Strict Execution Rules: *Do NOT invent slices. If authority cannot be determined: STOP and report the ambiguity.*
> 
> I cannot proceed to define the first slice implementation plan until the official Phase 8 slices are explicitly declared and approved. 

### Recommended Slice Architecture (Awaiting Approval)
Based on `0020-phase5a-rbac-authorization-decision.md` (which mandates RBAC must be solved *before* financial mutations), I recommend the following slice sequence:
1. **Slice 1: RBAC Architecture & Session Hydration** (Schema models + NextAuth hydration)
2. **Slice 2: Payment Voiding & Granular Authorization** (Service + UI + Event)
3. **Slice 3: Advance Revision** (Service + UI + Event)
4. **Slice 4: Price Revision** (Schema + Service + UI + Event)

## 5. Next Steps
- **USER ACTION REQUIRED**: Please approve the recommended slice architecture, or provide the authoritative Phase 8 slice definitions.

==============================================================
STATUS: BLOCKED PENDING SLICE DEFINITION APPROVAL
==============================================================
