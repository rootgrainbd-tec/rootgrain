# 0182-PHASE6-QC-LIFECYCLE-DESCOPE-AND-ROADMAP-RECONCILIATION

**Status:** APPROVED DECISION - QC LIFECYCLE REMOVED

## 1. Business Decision
The product owner has explicitly decided:
**QC LIFECYCLE IS NOT REQUIRED FOR ROOTGRAIN.**
The QC workflow, including the state machine, admin interfaces, pass/fail events, rework loops, and notifications are officially removed from the active roadmap.

## 2. Reason for De-scope
To provide a simplified, streamlined fulfillment flow. RootGrain customers should not be exposed to internal physical inspections (QC PASS, FAIL, REWORK). The business prefers a direct path from Production to Final Invoice to Dispatch.

## 3. Previous QC Roadmap
Previously governed by `0165`, `0166`, `0167`, and `0050`. The planned sequence was `Production Complete` → `QUALITY_CHECK` → `QC_PASS` → `READY_FOR_DISPATCH`. This entire branch is now cancelled.

## 4. New Active Order Flow
The active, simplified dependency graph is now:
**ORDER** ↓
**PRODUCTION** ↓
**FINAL INVOICE** ↓
**PAYMENT / BALANCE VERIFICATION** ↓
**DISPATCH** ↓
**DELIVERY**

There is NO mandatory QC Lifecycle between Production and Final Invoice.

## 5. Customer Experience
RootGrain customers will not see any reference to internal inspections, QC workflows, or rework delays. 

## 6. 0181 Impact Audit
The schema additions introduced in `0181` were audited across the entire repository to determine impact and removal safety.

| Item | QC-only? | Needed by active roadmap? | Action |
| :--- | :--- | :--- | :--- |
| `QualityInspection` (Table) | YES | NO | CANDIDATE FOR REMOVAL |
| `QualityInspectionStatus` (Enum) | YES | NO | CANDIDATE FOR REMOVAL |
| `TrackingState.REWORK` | YES | NO | CANDIDATE FOR REMOVAL |
| `TrackingState.READY_FOR_DISPATCH` | NO | NO (No staging step needed without QC) | CANDIDATE FOR REMOVAL |
| `Order.trackingNumber` | NO | YES (Needed by Dispatch) | KEEP |
| `Order.trackingUrl` | NO | YES (Needed by Dispatch) | KEEP |

## 7. QualityInspection Impact
- Codebase Search Results: The `QualityInspection` model, `QualityInspectionStatus` enum, `inspectorId`, and `evidenceKeys` are referenced **nowhere** outside of `prisma/schema.prisma`. 
- Status: **QC-ONLY / UNUSED**

## 8. QC Enum Impact
- `TrackingState.REWORK` is strictly tied to the abandoned QC failure loop.
- Status: **QC-ONLY / CANDIDATE FOR REMOVAL**
- `TrackingState.READY_FOR_DISPATCH` was intended as the post-QC holding state. In the new simplified flow, `ProductionState = COMPLETE` combined with `balanceDue == 0` acts as the implicit dispatch gate. A discrete manual staging state is unnecessary.
- Status: **CANDIDATE FOR REMOVAL**

## 9. Tracking Field Impact
- `Order.trackingNumber` and `Order.trackingUrl` are standard fulfillment properties. They are independent of QC and strictly required for the Dispatch and Delivery slices.
- Status: **KEEP**

## 10. Migration Impact
Migration `20260829032733_phase6_qc_schema_foundation` remains untouched to preserve migration history integrity. A future forward-migration will be required to drop the removed artifacts. No rollback or history rewriting was performed.

## 11. Data Safety
- Row Count Query on `QualityInspection`: **0 rows**.
- Status: **SAFE TO CONSIDER REMOVAL**. No production or test data relies on these tables.

## 12. Final Invoice Impact
The removal of QC has **NO IMPACT** on Final Invoices. The generation of `FINV-{OrderNumber}-{Sequence}`, `OrderDocument` PDFs, Vercel Blob storage, and related dependencies remain fully authoritative and intact.

## 13. Payment Impact
QC was already explicitly decoupled from payments. Payment mechanisms (`PaymentRecord`, `balanceDue`, `PaymentService`) remain completely independent and unharmed.

## 14. Dispatch Impact
**Prerequisite:** Dispatch explicitly requires a settled Final Invoice (where `balanceDue == 0` or equivalent payment condition is met). QC is officially removed as a Dispatch prerequisite. Dispatch implementation remains deferred to a future task.

## 15. Delivery Impact
Delivery depends solely on the courier handover (Dispatch) and final customer receipt. It is fully decoupled from any quality inspection metrics.

## 16. Historical Document Reconciliation
Any mention of `QC Lifecycle`, `QualityInspection`, `QC PASS`, `QC FAIL`, `REWORK`, `Quality Control`, or `Quality Inspection` in the following documents is hereby marked **SUPERSEDED BY BUSINESS DECISION**:
- `0165-phase6-resumption-qc-dispatch-specification.md`
- `0166-phase6-qc-dispatch-architecture-review.md`
- `0167-phase6-qc-dispatch-business-decision-record.md`
- `0050-phase6-slice6-quality-control-specification.md`

## 17. Active Roadmap
1. ORDER (Implemented)
2. PRODUCTION (Implemented)
3. FINAL INVOICE (Implemented)
4. PAYMENT (Next Active Step - Customer UI / Mechanics)
5. DISPATCH (Pending Payment)
6. DELIVERY (Pending Dispatch)

## 18. Next Work
With QC bypassed, the active order flow stops after Final Invoice. The very next required capability is Final Payment (or the Admin Dispatch implementation if Admin handles payments manually). Given `0180`'s rule that Dispatch is blocked until the Final Payment dependency is resolved:

NEXT ACTIVE SLICE:
Final Payment

READINESS:
READY FOR SPECIFICATION

## 19. Open Questions
- Does Final Payment require an online payment gateway (e.g., Stripe, bKash) for Customer UI, or is Admin Manual Recording sufficient to unblock the Dispatch slice immediately?

## 20. Final Decision

================================================================
FINAL DECISION
================================================================

QC LIFECYCLE —
REMOVED FROM ACTIVE ROADMAP

CUSTOMER-FACING QC —
NOT REQUIRED

QC WORKFLOW IMPLEMENTATION —
CANCELLED

================================================================
NEXT WORK
================================================================

NEXT ACTIVE SLICE:
Final Payment

READINESS:
READY FOR SPECIFICATION

================================================================
ZERO MUTATION CONFIRMATION
================================================================
Code = 0
Schema = 0
Migration = 0
DB = 0
Blob = 0
Inngest = 0
Resend = 0
Email = 0
Payment = 0
Package installation = 0
