# 0134-POST-PHASE8-STRATEGIC-ARCHITECTURE-GATE

**Document:** docs/approvals/0134-post-phase8-strategic-architecture-gate.md
**Status:** STRATEGIC RECOMMENDATION — NOT APPROVED

## 1. Phase 8 Completion
**Status: COMPLETED.**
- Slice 1 (RBAC Architecture) — COMPLETE
- Slice 2 (Payment Voiding) — COMPLETE
- Slice 3 (Advance Revision) — COMPLETE
- Slice 4 (Price Revision) — COMPLETE
All explicit Phase 8 requirements from the Canonical Roadmap have been met. No incomplete Phase 8 scope remains.

## 2. Canonical Roadmap Analysis
Based on `0008-phase3-repository-data-architecture-mapping.md`, `0018-phase6-roadmap-sequence-decision-adr.md`, and `0080-phase8-slice-architecture-approval.md`:
- **Original Sequence**: Phase 8 (Admin Order Management) → Phase 9 (Documents & Communication).
- **Rationale**: Financial mutation boundaries (Phase 8) needed to be secure (RBAC) and mathematically complete before generating final immutable, customer-facing PDF financial documents (Phase 9).
- **Deferred Work**: Numerous capabilities were deferred out of Phase 6, 7, and 8 to keep scopes manageable.

## 3. Deferred Work Inventory
An exhaustive read-only audit of previous approvals identifies the following explicitly deferred capabilities:
- **Phase 6**: Quality Control (QC), Dispatch & Delivery Lifecycle, Refunds, Double-Entry Accounting (`src/lib/domains/accounting` is disconnected).
- **Phase 7**: Vercel Blob / AWS S3 Integration (Customer uploads for CustomRequestItems).
- **Phase 8**: Refund / Credit authorization and mechanics.

## 4. Dependency Matrix
How deferred work relates to the canonical next phase (Phase 9):

| Deferred Item | Relationship to Phase 9 | Rationale |
| :--- | :--- | :--- |
| **Vercel Blob / AWS S3** | **B. Prerequisite** | Immutable documents (DOC-001) require a place to be securely stored. Dynamic regeneration violates financial immutability. |
| **QC & Dispatch Lifecycle** | **C. Partially Required** | Phase 9 (Communication) is responsible for notifying customers. Without QC/Dispatch events, the notification engine has limited lifecycle events to communicate. |
| **Refund & Credit Mechanics** | **A. Independent** | Financial logic. Phase 9 can generate basic Invoices and Receipts without supporting Refund notes initially. |
| **Double-Entry Accounting** | **A. Independent** | Background financial ledger logic. Completely decoupled from customer communication. |

## 5. Documents & Communication Readiness
Without implementation, the current system's readiness for Phase 9 is as follows:
- **Data Model**: MISSING (No `OrderDocument` or `Notification` schemas exist).
- **Storage**: MISSING (Only Sanity CMS exists, which is unsuitable for private/secure PDFs).
- **Document Gen**: PARTIAL (A prototype `src/lib/pdfGenerator.ts` exists but uses legacy hardcoded calculations, e.g., `advanceRequired = order.total * 0.2`).
- **File Access**: MISSING (No signed URLs or restricted API routes for file serving).
- **Authentication**: READY (NextAuth handles sessions).
- **RBAC**: READY (Phase 8 granular architecture can easily accept new permissions).
- **Audit Trail**: READY (`OrderEvent` handles generic lifecycle logging).
- **Customer Boundaries**: READY (Distinct `/admin` and `/(storefront)` boundaries exist).

## 6. Storage Decision Gate
**Can Documents & Communication safely proceed without a Vercel Blob / AWS S3 implementation?**
No.
- **Immutability Risk**: Without static storage, PDFs must be generated *dynamically* via `pdfGenerator.ts` on every request. If historical data (like a product's name) changes, dynamic generation might produce a different PDF than the original, violating financial immutability.
- **Attachment Risk**: Custom Orders (Phase 7) require image storage. Phase 9 requires invoice storage. A dedicated Blob storage provider is an absolute prerequisite.

## 7. Financial Workflow Intersection
**Does Phase 9 depend on completing Refunds, Credits, or Accounting first?**
No. The core requirement of Phase 9 is generating Initial Quotes, Advance Invoices, and Payment Receipts. Because Phase 8 finalized Price/Advance Revisions, the math for these documents is now stable. Refunds and Credit Notes can be added to the document generator in a later phase when the financial mechanics are built.

## 8. Customer Communication Intersection
**Current Capability**: MISSING/PARTIAL. 
While `src/lib/email/theme.ts` exists (hinting at a previous basic setup), Phase 6 explicitly confirmed "No emails are sent in Phase 6." The system lacks an Outbox pattern, retry mechanics, or template engine for robust transactional emails.

## 9. Security / RBAC Gate
**Can the current RBAC handle Phase 9?**
YES. The architecture built in Phase 8 Slice 1 uses a decoupled `Permission` string model. Introducing new candidate permissions like `document.view`, `document.download`, `communication.send` requires zero architectural changes—only simple database inserts and UI boundary checks.

## 10. Domain Boundary Analysis
Phase 9 is currently a monolith: "Documents & Communication". Logically, it contains two distinct domain boundaries:
1. **Document Storage & Generation**: Immutable PDF creation, Blob storage, signed URLs, and file attachment handling.
2. **Communication & Notifications**: Email dispatch, SMS (if applicable), Outbox pattern, event listeners, and customer-facing notification UI.

*Recommendation*: Phase 9 should be split into distinct execution slices respecting this boundary.

## 11. Sequencing Options

- **OPTION A**: Proceed directly to Phase 9 without storage. *(High Risk: Violates document immutability).*
- **OPTION B**: Implement Storage Foundation (Vercel Blob/S3) FIRST, then Phase 9. *(Low Risk: Ensures compliance and unblocks Phase 7 attachment limits).*
- **OPTION C**: Complete QC/Dispatch FIRST. *(Medium Risk: Delays customer communication further, but provides a complete production lifecycle to report on when Communication is finally built).*
- **OPTION D**: Complete Financial Deferred Work (Refunds). *(High Risk: Unnecessary delay for basic invoicing).*

## 12. Recommended Sequence
Based on architectural evidence, **OPTION B (Storage First) tightly coupled into Phase 9** is the most sound technical path.

**Proposed Next Sequence:**
1. **Phase 9 Slice 1**: Storage Foundation (Blob/S3 provisioning, secure file upload/download APIs).
2. **Phase 9 Slice 2**: Document Generation (Immutable PDF invoices, Quotes, `OrderDocument` database schema).
3. **Phase 9 Slice 3**: Communication Engine (Email templates, Outbox pattern, `OrderEvent` listeners).
4. **Phase 6 Resumption**: QC & Dispatch Lifecycle (triggering the new communication engine).

## 13. Candidate Phase 9 Capabilities (Evidence-Supported)
- `OrderDocument` Prisma schema (referenced in Phase 3 ADR).
- Blob Storage integration API routes (secure/signed URL generation).
- Immutable PDF Generation (upgrading `pdfGenerator.ts`).
- Transactional Email Dispatch (Resend/SendGrid).
- Admin UI for viewing generated documents.
- Customer UI for downloading invoices.

## 14. Open Architectural Decisions
The following must be resolved before Phase 9 implementation can begin:
- **Storage Provider**: Vercel Blob vs AWS S3 vs Supabase Storage.
- **Document Lifecycle**: When exactly is an invoice PDF generated? (e.g., synchronously on checkout, or asynchronously via an event queue?)
- **Communication Reliability**: Do we implement an Outbox pattern in the database to prevent email loss during server crashes, or use synchronous dispatch?

## 15. Production Risk Review
- **PII & File Access**: Invoices contain PII (addresses, phone numbers). Storage buckets MUST NOT be public. Signed URLs with strict RBAC/Session checks are mandatory.
- **Document Tampering**: Dynamic generation allows tampering. Static PDF storage is required for auditability.
- **Duplicate Messages**: Synchronous email dispatch inside Server Actions risks duplicate emails if the client retries a slow request.

## 16. Current System Baseline
- Phase 8 is COMPLETE.
- Migration chain is intact (18 base + 1 PriceRevision).
- PriceRevision logic and RBAC bootstrap are functional.
- Zero mutations were performed during this audit.

## 17. Decision Matrix

| Candidate Next Work | Dependency | Benefit | Risk | Prerequisite | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Storage Foundation** | None | Unblocks Immutable Docs & Phase 7 images | Low | None | **HIGH / NEXT** |
| **Document Gen** | Storage | Provides legal/financial customer artifacts | Med | Storage | **HIGH / NEXT** |
| **Communication** | Doc Gen | Automates customer updates | Med | Docs | **HIGH / NEXT** |
| **QC / Dispatch** | None | Completes MTO physical lifecycle | Low | None | MEDIUM (After P9) |
| **Refunds / Accounting**| None | Completes financial lifecycle | High | None | LOW (Deferred) |

## 18. Approval Required
This document represents a **read-only strategic recommendation**. 

**USER ACTION REQUIRED:**
Please provide explicit approval for the recommended sequence, or dictate an alternative architectural decision for the next phase of development. DO NOT PROCEED WITH IMPLEMENTATION WITHOUT APPROVAL.
