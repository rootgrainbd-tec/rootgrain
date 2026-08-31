# ROOTGRAIN — PHASE 5A
# RBAC AUTHORIZATION DECISION (ADR)

**Document:** `docs/approvals/0020-phase5a-rbac-authorization-decision.md`
**Status:** APPROVED

*Revision Note: Final governance hardening performed to clarify the temporary coarse-grained ADMIN authorization model and prevent Phase 5A from being interpreted as the project's target RBAC architecture.*

## 1. Context
Phase 5A requires a governance decision regarding the authorization model for recording payments. The `0019` specification deferred the decision of whether to rely on the existing coarse-grained `ADMIN` role check, or to introduce a new, granular financial permission (e.g., `PAYMENT_RECORD`).

## 2. Existing Authorization Model
A read-only inspection of the repository reveals two conflicting authorization realities:
- **Schema Layer:** The Prisma schema contains a complex RBAC architecture (`AuthRole`, `Permission`, `RolePermission`, `UserPermission`).
- **Runtime Layer:** The NextAuth configuration (`src/lib/auth.ts`) only hydrates the basic `Role` enum (`USER`, `ADMIN`) into the JWT session. It does NOT hydrate granular permissions.
- **Service Layer:** The Phase 5 `PaymentService` hardcodes the authorization check to `(session.user as any).role === "ADMIN"`. It currently has zero awareness of the granular `Permission` tables.

## 3. Option A (Coarse-Grained Role Authorization)
Rely strictly on the existing `ADMIN` role. Option A is explicitly classified as **AN INTENTIONAL TEMPORARY OPERATIONAL AUTHORIZATION MODEL**, not the target long-term RBAC architecture, not the permanent financial authorization design, and not a granular least-privilege model.

During Phase 5A, any authenticated user with the existing ADMIN role is authorized to record payments because this is the currently implemented server-side authorization contract.

## 4. Option B (Granular Financial Permission)
Introduce a granular `PAYMENT_RECORD` permission.
- **Implementation Dependencies:** This would require modifying `src/lib/auth.ts` to hydrate `UserPermission`/`RolePermission` into the session token, modifying `PaymentService.recordPayment` to enforce the new permission, modifying the database to seed the new permission, and updating existing admins. This violates the scope of Phase 5A.

## 5. Security Comparison & Limitations
- **Known Limitation:** Any user possessing `ADMIN` currently receives payment-recording authority. This is a known coarse-grained authorization limitation. Phase 5A does not attempt to solve granular financial authorization.
- **Least Privilege:** Option B is technically superior. However, Option A relies on the existing backend code, mitigating the immediate risk of introducing complex new JWT mutation logic that could corrupt sessions or escalate privileges.

## 6. Architecture Comparison
- **Current Architecture Compatibility:** Option A is 100% compatible with the current runtime. Option B requires a major overhaul of the NextAuth integration.
- **Implementation Complexity:** Option A adds zero complexity to the backend. Option B is a massive scope bloat that borders on Phase 8 (Unified Admin Order Management) territory.

## 7. Recommendation
**RECOMMENDATION: OPTION A**
The project should use the existing `ADMIN` role authorization as a temporary operational bridge.

## 8. Selected Authorization Contract
- **Who can record a payment?** Any authenticated actor possessing the `ADMIN` role.
- **Server Action Security Boundary:** Phase 5A Server Actions are NOT an authorization replacement. The required flow is strictly:
  `Admin UI → Server Action → authenticated server session → existing PaymentService → ADMIN authorization → financial transaction`.
- **Payment Service Authority:** `PaymentService.recordPayment()` remains the authoritative payment mutation boundary. Phase 5A does NOT redefine or duplicate authorization, idempotency, transaction handling, financial invariants, reference claims, or actor derivation. The Server Action MUST NOT:
  - trust client-supplied `recordedById`
  - calculate authoritative `advancePaid`
  - calculate authoritative `balanceDue`
  - bypass `PaymentService` authorization
  - write `PaymentRecord` directly
- **Unauthorized Request Semantics:** Phase 5A preserves the existing `PaymentService` unauthorized-request behavior.
- **No New Permission:** Phase 5A MUST NOT introduce `PAYMENT_RECORD` or any other new granular financial permission. No permission seed. No `auth.ts` permission hydration. No RBAC migration.

## 9. Phase 5A Scope Protection
Phase 5A is an operational bridge only. It must NOT expand into:
- granular RBAC
- payment reversal
- refund
- void
- price revision
- advance revision
- full order management
- Phase 6 MTO
- Phase 7 Custom Order

## 10. Future Phase 8 Impact & Mandatory Governance Follow-Up
Granular financial authorization MUST be revisited as part of Canonical Phase 8 before the system introduces additional financial mutations such as price revision, advance revision, void, refund, or reversal.

Phase 8 MUST perform a dedicated RBAC architecture and migration decision before introducing granular payment permissions. Phase 8 must explicitly evaluate:
- permission hydration into session
- authorization enforcement
- existing `Permission` / `RolePermission` / `UserPermission` schema
- permission assignment
- migration/seed requirements
- backward compatibility
- audit implications

## 11. Human Approval Gate
**STATUS:** APPROVED
**DECISION:** OPTION A — EXISTING ADMIN ROLE AUTHORIZATION

**AUTHORIZATION:** Phase 5A may proceed to its separate implementation specification/implementation approval process.

*Note: 0020 approval does NOT itself authorize Phase 5A implementation. Phase 5A implementation still requires its own implementation gate and explicit human approval.*
