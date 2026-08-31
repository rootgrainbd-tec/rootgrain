# 0145-PHASE9-SLICE2-DOCUMENT-GENERATION-ARCHITECTURE-SPECIFICATION

**Document:** docs/approvals/0145-phase9-slice2-document-generation-architecture-specification.md
**Status:** PROPOSED ARCHITECTURE — PENDING APPROVAL
**Date:** 2026-08-28

## 1. Executive Summary
This document defines the architecture specification for Phase 9 Slice 2: Document Generation. It resolves the gaps identified in the specification discovery (`0144`), establishing the exact mechanisms for generating, persisting, and securing physical PDF documents (Invoices, Quotes, Receipts) using the Vercel Blob Private Store and the immutable `OrderDocument` JSON snapshot model.

## 2. Source of Truth
**AUTHORITATIVE EXISTING REQUIREMENTS:**
- `0008-phase3-repository-data-architecture-mapping.md` (Post-commit PDF generation, Document Numbering, Receipt Identity).
- `0047-phase6-slice5-invoice-accounting-specification.md` (JSON immutability, `OrderDocument` state machine, Payment ledger authority).
- `0136-phase9-vercel-blob-storage-architecture-adr.md` (Vercel Blob Private Store).
- `0143-phase9-slice1-storage-foundation-private-store-report.md` (Storage foundation baseline).

## 3. Slice Boundary
**IN SCOPE (Slice 2):**
- Schema extension for `OrderDocument` to support physical storage metadata.
- PDF generation engine refactoring (reading strictly from JSON snapshots).
- Vercel Blob private upload integration for generated PDFs.
- Idempotent generation mechanisms.

**OUT OF SCOPE (Slice 2):**
- UI implementation (Generate, Preview, Download buttons) — Deferred to Slice 3.
- Communication (Email/SMS Outbox) — Deferred to Communication Slice.
- Quotes & Refunds logic — Generation of Quotes is deferred until the Quote business logic is built.

## 4. Document Types
- **Advance Invoice**: EXPLICITLY REQUIRED. Uses `OrderDocument` (`documentType: "INVOICE"`).
- **Payment Receipt**: EXPLICITLY REQUIRED. Uses `OrderDocument` (`documentType: "PAYMENT_RECEIPT"`).
- **Initial Quote**: EXPLICITLY REQUIRED in future, but currently lacks business logic. Will use `OrderDocument` (`documentType: "QUOTE"`).

## 5. OrderDocument Architecture
**Proposed Schema Changes:**
To link the physical immutable PDF to the JSON snapshot, the following fields are proposed for `OrderDocument`:
```prisma
  storageKey String? // Vercel Blob path. Nullable because generation is post-commit.
  checksum   String? // SHA-256 hash of the generated PDF buffer.
  size       Int?    // File size in bytes.
  mimeType   String  @default("application/pdf")
```

## 6. Immutability
**AUTHORITATIVE:**
- The `OrderDocument.snapshot` JSON is strictly immutable upon commit.
- The physical PDF, once generated and uploaded, is strictly immutable.
- Silent overwrite, silent replacement, and dynamic regeneration from mutable current order state are PROHIBITED.
- If a document needs regeneration due to template error, a formal `supersede` or `version` mechanism is required. For Slice 2, regeneration is explicitly DEFERRED.

## 7. Checksum
**RECOMMENDED:**
- **Algorithm**: SHA-256.
- **Target**: The final generated PDF byte buffer.
- **Timing**: Calculated immediately before Vercel Blob upload.
- **Storage**: Persisted in `OrderDocument.checksum`.
- **Purpose**: Verifies that the physical file retrieved from the provider perfectly matches the originally generated artifact, preventing tampering.

## 8. Storage Association
**AUTHORITATIVE:**
The canonical relationship is established as:
`OrderDocument.id` → `OrderDocument.storageKey` → `StorageAdapter.getSignedUrl(storageKey)` → Vercel Blob Private Store.
The provider URL is NEVER the canonical identity. The `storageKey` strictly belongs in `OrderDocument`.

## 9. PDF Technology
**RECOMMENDED:**
- **Keep `pdfkit`**.
- **Rationale**: `pdfkit` is already prototyped in `src/lib/pdfGenerator.ts`, executes within standard Node.js serverless constraints on Vercel without exceeding the 50MB function limit, and produces deterministic layouts.
- **Alternative Rejected**: `HTML-to-PDF` (Puppeteer) is too heavy for Vercel. `React-PDF` requires substantial refactoring and introduces Edge-runtime compatibility risks.

## 10. Snapshot / Data Source
**AUTHORITATIVE:**
PDFs MUST be generated strictly from `OrderDocument.snapshot`.
The generator MUST NOT fetch the current mutable `Order` state from the database.
Frozen values in the snapshot include: item prices, quantities, discounts, shipping, totals, customer information, store information, and the exact required advance/balance at issuance time.

## 11. Price Revision
**AUTHORITATIVE:**
The generated document must reflect the exact price state at issuance (finalized in Phase 8 Slice 4). The PDF generator is strictly a dumb renderer of the `snapshot` data.

## 12. Payment Integration
**AUTHORITATIVE:**
- Invoices do NOT mutate their snapshot or PDF when a payment is received.
- Payment Receipts are generated using authoritative, COMPLETED `PaymentRecord` data.

## 13. Numbering
**AUTHORITATIVE:**
- **Invoice**: `INV-{OrderNumber}-{Sequence}` (secured by row-level locking).
**RECOMMENDED:**
- **Quote**: `QT-{OrderNumber}-{Sequence}`.
- **Receipt**: `RCT-{PaymentId}`.

## 14. Generation Trigger
**AUTHORITATIVE:**
Post-commit background worker. (From `0008`: "Financial database commits MUST NOT depend on PDF rendering, Cloudinary, or email providers.")

## 15. Generation Model
**AUTHORITATIVE / RECOMMENDED:**
Asynchronous. Because pure queues are complex on Vercel without external infrastructure (Upstash/Inngest), the recommended approach is to utilize `Next.js` `waitUntil()` or a separate background job endpoint triggered by `OrderEvent`.
If asynchronous infrastructure cannot be reliably provisioned in Slice 2, a robust synchronous fallback may be proposed, but asynchronous is the authoritative target.

## 16. Consistency
**RECOMMENDED:**
1. Transaction creates `OrderDocument` with JSON snapshot (No `storageKey`).
2. Post-commit trigger starts PDF generation.
3. PDF generated & hashed.
4. Upload to Vercel Blob Private Store.
5. Update `OrderDocument` with `storageKey` and `checksum`.
**Failure Model**: If Blob upload fails, the background job retries. The DB transaction has already safely captured the JSON snapshot.

## 17. Idempotency
**RECOMMENDED:**
Duplicate generation requests are aborted by checking if `OrderDocument.storageKey` is already populated.

## 18. Lifecycle
**AUTHORITATIVE:**
Invoice lifecycle: `ISSUED → VOIDED`.
When voided, the PDF, snapshot, and storage object are retained. Immutable artifacts are NEVER physically deleted.

## 19. Quote Lifecycle
**UNRESOLVED:**
QUOTE LIFECYCLE REQUIRES FUTURE DECISION.

## 20. Receipt Lifecycle
**AUTHORITATIVE:**
Receipts are immutable issued artifacts. One completed payment generates exactly one receipt document.

## 21. RBAC
**RECOMMENDED:**
The following permissions will be added to the RBAC matrix:
- `document:generate` (Admin capability to trigger manual fallback generation)
- `document:view` (Admin view)
- `document:download` (Admin physical file access)

## 22. UI Boundary
**AUTHORITATIVE:**
UI (Buttons, Previews, Download pages) is strictly OUT OF SCOPE for Slice 2.

## 23. Audit Events
**RECOMMENDED:**
- `DOCUMENT_GENERATED`
- `DOCUMENT_VOIDED`

## 24. Template Version
**AUTHORITATIVE:**
`templateVersion` is stored in `OrderDocument`.
If the code in `pdfGenerator.ts` changes structurally, the `templateVersion` constant must be bumped (e.g., `v1` to `v2`). Legacy documents MUST still render correctly if regenerated, or regeneration must be locked to specific versions.

## 25. Branding
**AUTHORITATIVE:**
`StoreSettings` (Company name, address, support contact) must be injected into the `OrderDocument.snapshot` at generation time to ensure historical branding is preserved if settings change.

## 26. Legacy Generator
**AUTHORITATIVE:**
`src/lib/pdfGenerator.ts` MUST BE REFACTORED.
The legacy calculation (`advanceRequired = order.total * 0.2`) MUST be removed. The generator must only read from the provided `snapshot`.

## 27. PDF Content
- **Invoice**: snapshot totals, prices, items, advance due, bill to, ship to, metadata.
- **Quote**: Supported quoted fields.
- **Receipt**: Authoritative completed payment amount, method, date, linked invoice.

## 28. Determinism
**RECOMMENDED:**
Identical snapshot + `templateVersion` should produce deterministic visual content. Byte-for-byte binary equality is not guaranteed due to PDF metadata (e.g., creation timestamp headers), hence the checksum is locked at initial generation.

## 29. Metadata
**RECOMMENDED:**
`mimeType` = `application/pdf`, `size` in bytes, `checksum`, `storageKey`, `templateVersion`, `documentType`.

## 30. Private Access
**AUTHORITATIVE:**
All generated PDFs use the Vercel Blob Private Store. Access is mediated by `StorageAdapter.getSignedUrl()`. Permanent public URLs are prohibited.

## 31. Security
**RECOMMENDED MITIGATIONS:**
- **URL Leakage**: Short-lived signed URLs (e.g., 5-minute expiry).
- **Document Enumeration**: `referenceIdentity` uses CUIDs or non-sequential identifiers where applicable, and database checks prevent cross-customer access.
- **Snapshot Tampering**: JSON snapshot is never exposed for mutation.
- **PII Leakage**: Private bucket; no public bucket policies.

## 32. UAT
**FUTURE UAT REQUIREMENTS:**
1. PDF content perfectly matches JSON snapshot.
2. Checksum validation succeeds.
3. Direct Blob URL returns 403 Forbidden.
4. Signed URL allows access and expires correctly.
5. Legacy hardcoded calculations are removed.
6. Generation failure gracefully allows retry without data corruption.

## 33. Remaining Gaps
- **Next.js Asynchronous Execution**: The exact Vercel infrastructure for the "post-commit background worker" (e.g., `waitUntil`, Serverless Functions, or Vercel Cron) requires a technical spike to verify reliability before implementation.
- **Receipt Schema**: Whether `referenceIdentity` for receipts uses `paymentId` directly needs validation against the Prisma schema unique constraints.

## 34. Approval Required
**STATUS: PROPOSED ARCHITECTURE — PENDING CANONICAL APPROVAL.**
DO NOT IMPLEMENT. Waiting for architecture review.
