# ROOTGRAIN — PHASE 6 GOVERNANCE DECISION
# ADR FOR ROADMAP SEQUENCE CONFLICT

**Document:** `docs/approvals/0018-phase6-roadmap-sequence-decision-adr.md`
**Status:** APPROVED

## 1. Context
The Phase 6 Pre-Specification Reconnaissance (`0017-phase6-pre-specification-reconnaissance.md`) identified a fundamental conflict between the frozen canonical project roadmap and the current operational reality. Phase 5 successfully deployed a robust Payment Ledger to the production backend, but without the corresponding frontend administration interfaces, operations staff cannot utilize the ledger.

## 2. Current Production State
- **Phase 5 Payment Ledger:** BACKEND DEPLOYED (Commit `00af40a`).
- **Admin Payment API/UI:** NOT AVAILABLE.
- **Result:** The deployed payment ledger is inaccessible to operations staff, preventing the recording of manual payments on live orders.

## 3. Frozen Canonical Roadmap
The frozen canonical roadmap defined in `0008-phase3-repository-data-architecture-mapping.md` dictates the following sequence:
- **Phase 6:** MTO / Made-to-Order Engine
- **Phase 7:** Custom Order Request System
- **Phase 8:** Unified Admin Order Management
- **Phase 9:** Documents & Communication

## 4. Operational Conflict
Proceeding directly to Canonical Phase 6 (MTO Engine) leaves the Phase 5 Payment Ledger inaccessible until Canonical Phase 8 (Unified Admin Order Management). This renders the core financial infrastructure "dark code" for an extended period, blocking daily financial operations.

## 5. Options Considered
To resolve this operational conflict, three primary options were evaluated:
- **OPTION A:** Strictly follow roadmap and begin MTO now.
- **OPTION B:** Move full Canonical Phase 8 into Phase 6.
- **OPTION C:** Create Phase 5A operational bridge, then proceed to Canonical Phase 6.

## 6. Option A Analysis (Strictly follow roadmap and begin MTO now)
- **Benefits:** 100% adherence to the frozen governance roadmap. Preserves existing sprint expectations for the factory floor.
- **Risks:** The payment ledger remains inaccessible. Technical debt accrues as the backend financial model diverges temporally from the frontend UI.
- **Operational Consequences:** Staff must continue using legacy or manual offline tracking for payments despite having a robust backend. 
- **Governance Consequences:** Zero roadmap deviation.
- **Scope Impact:** Standard Phase 6 MTO scope.

## 7. Option B Analysis (Move full Canonical Phase 8 into Phase 6)
- **Benefits:** Solves the operational gap completely and provides full administrative control (Price Revisions, Advance Revisions, Voiding, etc.).
- **Risks:** Massive scope bloat. Halts all progress on MTO tracking for a significant duration. Highly complex authorization and UI matrix to implement at once.
- **Operational Consequences:** Delays factory operations tracking indefinitely while the admin panel is built.
- **Governance Consequences:** Requires permanently renumbering and redefining the canonical roadmap.
- **Scope Impact:** Extremely large, high-risk monolithic implementation.

## 8. Option C Analysis (Create Phase 5A operational bridge, then proceed to Canonical Phase 6)
- **Benefits:** Unblocks the immediate operational need (recording payments) with minimal scope. Preserves the overall roadmap sequence.
- **Risks:** Introduces a new, albeit small, micro-phase into the development lifecycle.
- **Operational Consequences:** Operations staff gain immediate ability to record and view payments, unlocking the ROI of Phase 5 quickly. Factory tracking (MTO) is only slightly delayed.
- **Governance Consequences:** Requires formal approval of a new micro-phase (5A) without altering the canonical phase numbering.
- **Scope Impact:** Narrowly scoped, low-risk frontend/API layer over existing, proven backend services.

## 9. Recommended Decision
**RECOMMENDATION: OPTION C**
Create a **PHASE 5A — ADMIN PAYMENT OPERATIONS MICRO-PHASE**. 
This is an architectural recommendation based on facts gathered in `0017`. It provides an operational dependency bridge for the already-deployed Payment Ledger before returning to the canonical roadmap.

## 10. Phase 5A Proposed Scope
Include ONLY the following strictly scoped features:
1. Admin authentication/session enforcement.
2. RBAC/permission enforcement for payment operations.
3. Admin API for recording a payment (leveraging existing `PaymentService`).
4. Admin Order Details payment-history visibility (UI component).
5. Payment ledger display (UI component).
6. Idempotency/error handling UX (handling duplicate submissions cleanly).
7. Read-only financial summary (UI component):
   - `total`
   - `legacy advance` (if applicable)
   - `completed payments`
   - `advancePaid` (derived/canonical)
   - `balanceDue`
8. Audit/event visibility where already available.

## 11. Explicit Out-of-Scope
Do NOT include the following (they remain in their respective future phases):
- Void Payment
- Refund workflow
- Payment reversal
- Revise Price
- Revise Required Advance
- MTO state management
- Custom Order Request
- Full Admin Order Management suite
- PDF worker
- Email worker
- Notification delivery infrastructure
- Promotional code changes
- Public customer UI

*Reason:* These are separate business workflows that require their own approved specifications before implementation.

## 12. Security Requirements
Any Admin payment mutation MUST enforce the following:
- **Authenticated session:** Request must originate from a valid logged-in session.
- **Admin authorization:** User must have explicit administrative permission to record payments.
- **Server-side actor derivation:** The `recordedById` must be derived from the trusted server session, NEVER trusted from the client payload.
- **Server-side financial calculation:** Do NOT trust client-supplied `advancePaid`, `balanceDue`, or payment totals.
- **Idempotency:** Strict idempotency key enforcement.
- **Transaction atomicity:** All operations must use the existing atomic transaction boundary.
- **Audit trail:** Actions must be fully logged.

## 13. Financial Safety Requirements
Because Phase 5 is already live in production, Phase 5A MUST safely consume the existing Payment Ledger contract. 
It must **NOT** redefine:
- `PaymentRecord` semantics.
- Financial invariants.
- `PaymentReferenceClaim` semantics.
- Idempotency semantics.
- `OrderEvent` semantics.
*(Any change to these foundational contracts requires a newly approved specification).*

## 14. Roadmap Impact
Phase 5A does **not** alter the canonical roadmap numbering. 
- **Canonical Phase 6 remains:** MTO / Made-to-Order Engine.
- **Canonical Phase 8 remains:** Unified Admin Order Management.
Phase 5A exists solely as an operational dependency bridge.

## 15. Dependencies
- Deployed Phase 5 Payment Ledger and Transaction Foundation.
- Existing Admin Authentication mechanisms (NextAuth / session provider).

## 16. Risks
- Delaying MTO by the duration of the Phase 5A micro-sprint.
- Accidental scope creep into Phase 8 features if not strictly policed.

## 17. Required Human Decision
A human authority must formally accept or reject the proposal to execute Phase 5A before proceeding to Canonical Phase 6.

## 18. Approval Gate

PHASE 5A PROPOSAL:
**APPROVED**

CANONICAL PHASE 6 STATUS:
**BLOCKED PENDING PHASE 5A COMPLETION**
