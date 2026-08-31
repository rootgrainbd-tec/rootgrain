ROOTGRAIN — PHASE 6 — SLICE 6
QUALITY CONTROL LIFECYCLE
APPROVAL SPECIFICATION
==============================================================

## 1. Executive Summary

This document specifies the exact architecture for Phase 6 Slice 6. Following the deep repository audit, the system correctly pauses MTO orders at `ProductionState = COMPLETE` and `TrackingState = QUALITY_CHECK`. 

To safely proceed to Final Invoicing or Dispatch, the physical goods must be inspected. Quality Control (QC) is determined to be the smallest, safest, and most logically coherent next step. Slice 6 will introduce the Quality Control lifecycle, enabling administrators to pass or fail MTO products, enforce rework loops, and safely transition orders to a dispatch-ready state.

## 2. Current Phase 6 Status

- **Slice 1 (MTO Schema)**: APPROVED & IMPLEMENTED
- **Slice 2 (Customer MTO Checkout)**: APPROVED & IMPLEMENTED
- **Slice 3 (Admin MTO Workflow)**: APPROVED & IMPLEMENTED
- **Slice 4 (Manufacturing Handoff)**: APPROVED & IMPLEMENTED
- **Slice 5 (Invoice/Accounting)**: APPROVED & IMPLEMENTED (Closed)

Slice 5 explicitly deferred QC, Final Invoicing, Dispatch, Delivery, and Accounting.

## 3. Current Repository Architecture

- **MTO Admin Service**: Halts at `completeMtoProduction`, setting `ProductionState = COMPLETE` and `TrackingState = QUALITY_CHECK`. `OrderStatus` remains `PROCESSING`.
- **Quality Control**: The `QUALITY_CHECK` enum exists in `TrackingState`, but there are absolutely no supporting models, validation logic, or Admin UIs to move the order out of this state.
- **Dispatch**: Handled fundamentally for standard orders (emails for `DISPATCHED` and `DELIVERED` exist), but MTO lifecycle is disconnected from it.
- **Accounting**: A placeholder Domain-Driven Design (DDD) module exists in `src/lib/domains/accounting`, but it is disconnected from the Prisma database and `PaymentRecord`. Double-entry accounting is fully deferred.

## 4. Deferred Functionality Audit

| Feature | Status | Findings |
|---------|--------|----------|
| **Quality Control** | Completely Absent | `TrackingState` enum exists, but no `QualityInspection` model or transition logic. |
| **Final Invoice** | Completely Absent | Requires QC pass. Slice 5 only supports `ADVANCE` invoices. |
| **Final Payment** | Completely Absent | Blocked by Final Invoice. The UI does not render balance-due payment forms. |
| **Dispatch / Delivery** | Partially Implemented | Existing legacy logic handles standard orders, but MTO lacks a bridge to dispatch. |
| **Refunds** | Completely Absent | `PaymentStatus.REFUNDED` exists, but no logic or gateway integration is present. |
| **Accounting** | Designed, Not Implemented | `AccountingRepository` interfaces exist, but no DB implementation or double-entry ledger exists. |

## 5. Candidate Slice Comparison

| Candidate | Dependencies | Complexity | Risk | Value | Recommended? |
|-----------|--------------|------------|------|-------|--------------|
| **1. Quality Control (QC)** | Prod Complete (Slice 4) | Medium | Low | High (Unblocks everything else) | **YES** |
| **2. Final Invoice / Payment** | QC Pass | High | High (Financial) | High | NO (Logical sequence violation) |
| **3. Dispatch & Shipping** | QC Pass, Final Payment | High | Medium | High | NO (Logical sequence violation) |
| **4. Refunds** | Payment | High | High (Financial) | Medium | NO (Can be deferred) |

## 6. Recommended Slice 6

**Slice 6: Quality Control (QC) Lifecycle**

It is the exact next step in the physical lifecycle. It isolates operational state transitions (Pass/Fail/Rework) from the upcoming high-risk financial operations (Final Invoicing).

## 7. Business Lifecycle Position

MTO Created → Advance Required → Admin Confirmation → Advance Invoice → Advance Payment → Production Started → Production Complete → **[SLICE 6: QUALITY CHECK]** → [Deferred: Final Invoice] → [Deferred: Dispatch]

## 8. Detailed Architecture

Slice 6 will introduce:
1. **QualityInspection Model**: An immutable audit record of a QC event (Pass/Fail), the inspector ID, notes, and evidence URLs (photos).
2. **State Transition Engine**: 
   - `QUALITY_CHECK` → (Fail) → `REWORK`
   - `REWORK` → (Complete) → `QUALITY_CHECK`
   - `QUALITY_CHECK` → (Pass) → `READY_FOR_DISPATCH`
3. **Admin UI**: A QC management overlay in the Admin Order details page.
4. **Order Events**: `QC_PASSED`, `QC_FAILED`, `REWORK_STARTED`, `REWORK_COMPLETED`.

## 9. State Machine Impact

**Current TrackingState**: `PENDING_PRODUCTION`, `IN_PRODUCTION`, `QUALITY_CHECK`, `DISPATCHED`, `OUT_FOR_DELIVERY`, `DELIVERED_AND_COLLECTED`

**Required Changes**:
We must safely add two new enum values to `TrackingState` in Postgres:
- `REWORK`
- `READY_FOR_DISPATCH`

**Valid Transitions**:
- `QUALITY_CHECK` → `REWORK`
- `REWORK` → `QUALITY_CHECK`
- `QUALITY_CHECK` → `READY_FOR_DISPATCH`

`OrderStatus` remains `PROCESSING`.
`ProductionState` remains `COMPLETE` (or transitions to `IN_PROGRESS` if Rework dictates a full production rollback—this is an Open Business Decision).

## 10. Data Model

```prisma
enum QcStatus {
  PASS
  FAIL
}

model QualityInspection {
  id           String   @id @default(cuid())
  orderId      String
  inspectorId  String
  status       QcStatus
  notes        String?
  evidenceUrls Json?    // Array of image URLs
  createdAt    DateTime @default(now())
  order        Order    @relation(fields: [orderId], references: [id], onDelete: Restrict)

  @@index([orderId])
}
```

## 11. Database Impact

- **Models**: Add `QualityInspection`.
- **Enums**: Add `QcStatus`. Add `REWORK` and `READY_FOR_DISPATCH` to `TrackingState` (via raw SQL `ALTER TYPE "TrackingState" ADD VALUE 'REWORK'` to avoid historical migration conflicts).
- **Relations**: Add `qualityInspections QualityInspection[]` to `Order`.
- **Migration Risk**: Low. Appending to enums is safe in Postgres. Adding a table is non-destructive. Historical data is completely unaffected.

## 12. Concurrency

- QC Pass/Fail operations must acquire a `SELECT * FROM "Order" WHERE id = $1 FOR UPDATE` lock.
- This prevents race conditions where two admins simultaneously pass and fail the same order, leading to conflicting `TrackingState` and audit events.

## 13. Idempotency

- `QualityInspection` submissions will utilize the existing `IdempotencyKey` engine.
- Scope: `qc_inspection`.
- Fingerprint: Hash of `orderId:status:notes`.
- Prevents double-submission on network retries.

## 14. Admin Workflow

- Navigate to `Admin > Orders > [MTO Order]`.
- If `TrackingState == QUALITY_CHECK`, the "Quality Control" panel activates.
- Admin can upload evidence (photos) and click **FAIL (Send to Rework)** or **PASS (Ready for Dispatch)**.
- If `TrackingState == REWORK`, the panel allows the Admin to click **Rework Completed (Send to QC)**.

## 15. Customer Workflow

- In the Customer Track Order UI:
  - If `QUALITY_CHECK`: Displays "Quality Control - Inspecting your item".
  - If `REWORK`: Displays "Quality Control - Minor adjustments being made".
  - If `READY_FOR_DISPATCH`: Displays "Ready for Dispatch - Preparing shipment".

## 16. OrderEvent

New Events:
- `QC_FAILED` (Payload: `{ inspectionId, notes }`)
- `QC_PASSED` (Payload: `{ inspectionId, notes }`)
- `REWORK_STARTED`
- `REWORK_COMPLETED`

## 17. NotificationOutbox

- **QC_FAILED / REWORK**: Do NOT notify the customer (internal operational detail).
- **QC_PASSED**: Notify the customer via email ("Your custom furniture has passed Quality Control!").

## 18. RBAC

- Only `ADMIN` role can execute QC pass/fail operations.
- Enforced server-side in `QcAdminService`.

## 19. Standard Order Compatibility

- Standard Orders do not enter `QUALITY_CHECK` tracking state by default.
- If a Standard Order is manually placed into `QUALITY_CHECK`, this system will safely process it.
- Adding enum values to `TrackingState` is backwards compatible and does not affect existing Standard Orders.

## 20. Test Strategy

- **Happy Path**: Complete Production → Pass QC → TrackingState becomes `READY_FOR_DISPATCH`.
- **Rework Loop**: Complete Production → Fail QC → TrackingState becomes `REWORK` → Rework Complete → Fail QC again → Rework Complete → Pass QC.
- **Concurrency**: Two admins attempting to Pass and Fail simultaneously. Exactly one succeeds, one fails due to state mismatch after lock.
- **Idempotency**: Duplicate network requests for Pass QC yield exactly one `QualityInspection` record.

## 21. Rollback

- **Application Rollback**: Revert `src/services/qc-admin.service.ts` and UI changes.
- **Database Rollback**: `QualityInspection` table can be dropped safely. `TrackingState` enum additions cannot be easily rolled back in Postgres without recreating the type, but they are harmless orphans if unused.

## 22. Risks

- **Enum Mutation**: Prisma's handling of Postgres enum additions requires care to ensure the generated migration doesn't attempt to recreate the entire enum type, which could lock the table. A manual raw SQL migration is recommended for enum modification: `ALTER TYPE "TrackingState" ADD VALUE IF NOT EXISTS 'REWORK';`

## 23. Open Business Decisions

1. **Rework Semantics**: When QC fails, does the `ProductionState` regress to `IN_PROGRESS`, or does it remain `COMPLETE` while `TrackingState` changes to `REWORK`? (Recommendation: Leave `ProductionState` as `COMPLETE` and use `TrackingState` to track the rework loop).
2. **Final Invoice Timing**: Must the customer be issued the Final Invoice *before* or *after* QC pass? (Recommendation: Issue Final Invoice *after* QC Pass. Handled in Slice 7).

## 24. Explicit Out-of-Scope

- Final Invoice Generation
- Final Payment Collection
- Dispatch / Courier Integration
- Delivery Confirmations
- Refund Processing
- Accounting Ledgers

## 25. Acceptance Criteria

1. Schema migration adds `QualityInspection` model and `QcStatus` enum.
2. Schema migration safely appends `REWORK` and `READY_FOR_DISPATCH` to `TrackingState`.
3. `QcAdminService` implements idempotent, concurrency-safe `passQc`, `failQc`, and `completeRework` methods.
4. Admin UI conditionally renders QC controls based on `TrackingState`.
5. Customer tracking UI maps new tracking states to customer-friendly labels.
6. OrderEvents accurately reflect the QC/Rework loop.
7. Outbox notification is triggered ONLY on QC pass.

==============================================================
STATUS: AWAITING APPROVAL
==============================================================
