# 0148-PHASE9-SLICE2-DURABLE-EXECUTION-CANONICAL-ADR

**Document:** docs/approvals/0148-phase9-slice2-durable-execution-canonical-adr.md
**Status:** PROPOSED / PENDING CANONICAL APPROVAL
**Date:** 2026-08-28

## 1. Decision Summary
**PRIMARY DURABLE EXECUTION ARCHITECTURE: INNGEST**

**Reason:**
- already installed
- partially initialized
- durable external execution
- automatic retry
- exponential backoff
- step-based execution
- concurrency controls
- observability
- native Vercel/Next.js compatibility
- lower operational complexity than Cron polling

*Note: Inngest is selected but not yet implemented/fully integrated.*

## 2. Context
Phase 9 Slice 2 requires generating physical immutable PDF documents (Invoices, Receipts) immediately after financial database transactions are committed. To protect core business logic, the financial transaction must not depend on the successful execution of the PDF generator or the Vercel Blob object storage provider. This requires a durable asynchronous background execution architecture.

## 3. Current Architecture
**Current State:**
- `inngest` package installed
- `src/inngest/client.ts` exists
- `order/confirmation.requested` exists
- NO `/api/inngest/route.ts`
- NO active document generation function

Therefore: **INNGEST ARCHITECTURE SELECTED BUT INNGEST INTEGRATION NOT YET IMPLEMENTED.**

## 4. Problem
A database commit cannot safely depend on a slow, error-prone external provider upload (Vercel Blob) or intensive PDF generation (pdfkit). If a non-durable mechanism (like standard Next.js `waitUntil`) is used and fails, the transaction cannot be safely rolled back, and the required physical document is permanently lost.

## 5. Options Considered
- **Inngest:** Durable, event-driven, natively handles retries.
- **Vercel Cron:** Durable, but introduces high latency and requires complex manual locking to prevent concurrent executions.
- **waitUntil:** Native Next.js, but strictly non-durable with no automatic retries.

## 6. Inngest Decision
Inngest is the canonical choice. It resolves the problem by decoupling the workload durably with automatic exponential backoff retries, ensuring transient provider failures do not permanently drop the document generation request.

## 7. Event Model
**Canonical event:** `document/generation.requested`

Payload MUST contain only stable identifiers:
```json
{
  "orderDocumentId": "cuid...",
  "documentType": "INVOICE"
}
```
Do NOT include customer PII, payment secrets, provider credentials, PDF contents, or mutable financial payloads in the event stream.

## 8. Post-Commit Flow
Canonical intended flow:
1. Financial transaction
2. DATABASE COMMIT
3. Dispatch `document/generation.requested`
4. INNGEST DURABLE FUNCTION
5. Read `OrderDocument.snapshot`
6. Generate PDF using `pdfkit`
7. SHA-256
8. Upload to Vercel Blob PRIVATE STORE
9. Conditional `OrderDocument` update
10. Complete

*Financial transaction MUST NOT depend on PDF generation.*

## 9. Retry
Inngest handles:
- PDF generation failure
- Blob upload failure
- transient DB failure
through automatic retry/backoff.
Do NOT add custom retry loops in application code.

## 10. Idempotency
Canonical protection:
1. Durable Inngest execution.
2. `step.run` where appropriate.
3. Conditional database update:
   `where: { id: orderDocumentId, storageKey: null }`

This heavily mitigates duplicate generation, but an isolated orphan-Blob possibility technically remains if the upload succeeds but the database connection resets before the update commits.

## 11. DB Consistency
Important unresolved reliability edge:
1. DB commit succeeds
2. `inngest.send()` fails
3. `OrderDocument` exists but no generation job exists.

**CURRENT SLICE 2 MITIGATION:** Admin manual retry/generate fallback.
**FUTURE HARDENING:** Transactional outbox/generalized event reliability.
*Do NOT implement either now.*

## 12. Outbox Gap
Current `NotificationOutbox` is notification-specific. It MUST NOT be represented as a generalized document-generation outbox.
**NO GENERALIZED TRANSACTIONAL OUTBOX CURRENTLY EXISTS.**

## 13. Cron Comparison
Cron is rejected for primary architecture because:
- polling latency
- additional locking complexity
- higher implementation complexity
- weaker observability
- unnecessary duplication of durable execution capabilities

Cron may remain a future recovery mechanism if needed.

## 14. waitUntil Comparison
**NOT SUITABLE.**
Reason:
- not durable
- no automatic retry
- work can be lost on runtime failure

## 15. Financial Safety
**Canonical rule:** Financial DB commit succeeds independently of PDF generation.
PDF failure MUST NOT roll back:
- order
- payment
- invoice snapshot
- financial ledger state

## 16. Private Storage
All generated customer/financial documents target: **Vercel Blob Private Store**
Canonical identity: `storageKey`
Access: RootGrain authorization → temporary signed access.
Never use permanent public URLs.

## 17. PDF Generation
Approved direction: **pdfkit** (already installed).
Existing legacy calculation `advanceRequired = order.total * 0.2` MUST NOT be reused as financial truth.
Document generation must derive entirely from the immutable JSON snapshot.

## 18. Document Types
Current Slice 2 supported direction:
- Invoice
- Payment Receipt

Quote: OUT OF SCOPE until Quote business logic exists.
Do not expand document types.

## 19. Invoice Identity
Canonical: `INV-{OrderNumber}-{Sequence}`
Sequence must be safely generated. Existing repository lacks a native per-order document sequence. Sequence generation implementation must be specified during the implementation-planning phase.

## 20. Receipt Identity
Canonical recommendation: `RCT-{PaymentId}`
Because `PaymentRecord.id` is a CUID and `OrderDocument` uses `@@unique([documentType, referenceIdentity])`, it supports global uniqueness safely. `PaymentRecord` does not require `receiptDocumentId`.

## 21. Immutability
Issued document = snapshot immutable + PDF immutable.
No silent overwrite. Any future regeneration must produce a new version/document according to the approved document lifecycle.

## 22. Checksum
Canonical: **SHA-256**
Hash the exact generated PDF bytes before Blob upload. Persist checksum with `OrderDocument`.

## 23. Template Version
Persist `templateVersion` (Current default: `"1.0"`).
Issued documents MUST remain historically reproducible even if future templates change.

## 24. Branding Snapshot
Current `StoreSettings` does not contain full branding. Branding currently comes from `src/data/site-config.ts`.
Required historical branding data must be captured in the immutable document snapshot.

## 25. Authorization
Document generation and document access must respect RootGrain authorization.
Do NOT add new RBAC permissions in this ADR. Future permissions (e.g., `document.view`, `document.download`) may require separate approval if existing RBAC cannot support the required access model.

## 26. Observability
Inngest dashboard is the primary execution visibility mechanism.
Minimum conceptual states: started, retrying, failed, completed.
Do NOT add an external observability provider.

## 27. Cost
Current official provider limits for Inngest's free tier must be verified at implementation/deployment time to ensure limits are not breached.

## 28. Future Implementation
Implementation planning will eventually require:
1. `/api/inngest/route.ts`
2. `document/generation.requested` event
3. `generateDocument` durable function
4. environment configuration
5. retry policy
6. idempotency/conditional DB update
7. PDF generation integration
8. SHA-256
9. private Blob upload
10. `OrderDocument` update
11. manual retry fallback

These are FUTURE IMPLEMENTATION ITEMS. Do NOT implement now.

## 29. Migration Boundary
This ADR does NOT perform migration. If `OrderDocument` schema changes are required by Slice 2, they must be handled in the separate implementation planning and migration stage.

## 30. Risks
The primary risk remains the gap between the database transaction commit and the external `inngest.send()` trigger. Without an outbox, network failures exactly at that millisecond will leave an un-generated document. The admin fallback UI mitigates this operational risk for Slice 2.

## 31. Approval Statement

"I approve the Phase 9 Slice 2 durable execution architecture. RootGrain will use Inngest as the durable asynchronous execution layer for post-commit document generation, while Vercel Blob Private Store remains the document object-storage provider. Financial transactions remain independent of PDF generation, and document generation will consume immutable OrderDocument snapshots."

Status: PENDING OPERATOR APPROVAL
