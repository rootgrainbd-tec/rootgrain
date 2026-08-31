# ROOTGRAIN — PHASE 6
# PRE-SPECIFICATION RECONNAISSANCE

**Document:** `docs/approvals/0017-phase6-pre-specification-reconnaissance.md`
**Status:** READY FOR REVIEW

## 1. Phase 5 Closure Status
A complete review of the Phase 5 governance and deployment chain confirms the following status:
- 0014: **APPROVED**
- 0015: **APPROVED**
- 0016: **IMPLEMENTATION APPROVED**
- Implementation: **VERIFIED**
- Migration dry-run: **VERIFIED**
- Live production backup: **VERIFIED**
- Production migration: **COMPLETED**
- Post-migration verification: **VERIFIED**
- Production deployment: **VERIFIED SUCCESSFUL**

**PHASE 5 STATUS:** READY FOR FORMAL CLOSURE

## 2. Phase 5 Remaining Findings
- **Unresolved Findings:** NONE.
- Both post-implementation findings (local database outage, production backup absence) were formally resolved prior to the production deployment gate.

## 3. Post-Release Observation Requirements
The following metrics and behaviors MUST be observed in the live production environment without mutating data or creating artificial test records:
- **Application Errors:** Monitor Next.js/Vercel runtime logs for unhandled exceptions or 500 errors during checkout and order viewing.
- **Prisma/Database Errors:** Monitor for connection pool exhaustion or migration-related mapping errors.
- **Payment Service Errors:** Monitor logs for expected idempotency collisions or reference claim conflicts (e.g., `PaymentReferenceClaim` unique constraint violations) to ensure race-condition defenses are working.
- **OrderEvent Creation:** Verify via read-only database query that new live orders successfully append `ORDER_CREATED` events to the ledger.
- **OrderDocument Creation:** Verify that immutable JSON document snapshots are being successfully persisted.
- **NotificationOutbox Creation:** Verify that email delivery intents are being inserted into the outbox.
- **Unexpected PaymentRecord Behavior:** Verify the `PaymentRecord` count remains structurally coherent (no records created via legacy pathways).
- **Financial Invariants:** Run strict mathematical invariant checks to ensure `balanceDue` strictly equals `total - advancePaid` for all active orders.

## 4. Repository State
A read-only reconnaissance of the repository reveals the following state:
- **Financial Backend (Phase 4/5):** Core transaction ledger, `PaymentRecord`, idempotency, and atomic mutations exist in `src/services/payment.service.ts`.
- **Operational UI Gap:** There are **ZERO** API routes or Admin UI surfaces connected to the new Payment Ledger. Admins currently have no interface to record payments, revise prices, or void payments.
- **MTO Engine Gap:** The `Order.trackingState` is still conflated. The foundational `ProductionState` enum for Made-to-Order workflows does not yet exist.
- **Notification/Document Gap:** `NotificationOutbox` and `OrderDocument` records are being saved to the database, but there is no background processor (CRON/Worker) to render PDFs or dispatch emails from the outbox.
- **Canonical Roadmap:** `0008-phase3-repository-data-architecture-mapping.md` defines the frozen roadmap:
  - Phase 6: MTO / Made-to-Order Engine
  - Phase 7: Custom Order Request System
  - Phase 8: Unified Admin Order Management
  - Phase 9: Documents & Communication

## 5. Candidate Phase 6 Work
Based on repository evidence, the following are logical candidates for immediate work:

- **Candidate A: MTO / Made-to-Order Engine (Canonical Phase 6)**
  - Decouples operational `TrackingState` from `ProductionState`.
  - Supports workshop operations.
- **Candidate B: Unified Admin Order Management (Canonical Phase 8)**
  - Exposes the Phase 5 Payment Ledger to human operators via Admin API and UI.
  - Required to actually utilize the Phase 5 backend in production.
- **Candidate C: Documents, Outbox & Communication (Canonical Phase 9)**
  - Implements the background worker to process the accumulating `NotificationOutbox` and render PDFs from `OrderDocument`.
- **Candidate D: Custom Order Request System (Canonical Phase 7)**
  - Replaces generic `Inquiry` with `CustomRequest`.

## 6. Candidate Prioritization
1. **Unified Admin Order Management (CRITICAL):** Without this, the Phase 5 Payment Ledger is effectively dark code. Operational reliability and customer-facing financial tracking depend on admins being able to input data.
2. **MTO / Made-to-Order Engine (HIGH):** Next on the frozen roadmap. Required for scaling factory production tracking.
3. **Documents, Outbox & Communication (MEDIUM):** Database is safely capturing intents, but manual fallback is currently required for PDF/emails.
4. **Custom Order Request System (LOW):** Existing generic inquiries still function as a temporary fallback.

## 7. Recommended Phase 6 Objective
**RECOMMENDATION:** Execute **Unified Admin Order Management (Canonical Phase 8)** as the de facto Phase 6, OR explicitly authorize an accelerated **Admin Payment UI micro-phase** prior to MTO.

**Why:** Evidence strictly shows that Phase 5 built a robust backend payment ledger, but provided zero UI/API for admins to use it. Proceeding directly to MTO (Canonical Phase 6) leaves the payment ledger inaccessible, defeating the purpose of Phase 5.
**Problem Solved:** Connects the admin frontend to the payment ledger, enabling manual payment entry, price revision, and advance revision.

## 8. Dependencies
- Depends entirely on the Phase 4/5 transaction foundation (already deployed).
- Requires authentication/authorization matrix validation (`AuthRole` / `Permission` mappings).

## 9. Risks
- **Roadmap Deviation:** Elevating Admin UI deviates from the frozen `0008` roadmap sequence (Phase 6 -> Phase 8). This requires an explicit governance decision.
- **Security:** Exposing payment mutations to an API requires strict RBAC and session validation to prevent unauthorized financial tampering.

## 10. Proposed Scope
- Admin API routes for: `Record Payment`, `Void Payment`, `Revise Price`, `Revise Required Advance`.
- Admin UI components for the Order Details view to interface with these API routes.
- RBAC enforcement for financial mutations.

## 11. Explicit Out-of-Scope Items
- Production/MTO state management (Reserved for MTO Engine).
- Public-facing customer UI changes.
- Background PDF rendering (Reserved for Phase 9).
- Promotional code logic.

## 12. Required Decisions
- **DECISION 1:** Does the project strictly enforce the `0008` roadmap (Phase 6 = MTO), or do we elevate Admin Order Management to Phase 6 to unblock operational use of the Payment Ledger?

## 13. Recommended Next Governance Step
Create a formal **Decision Record (ADR)** to resolve the roadmap sequence conflict between MTO and Admin UI, followed by the formal Phase 6 Specification.
