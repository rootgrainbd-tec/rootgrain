# 0144-PHASE9-SLICE2-DOCUMENT-GENERATION-SPECIFICATION-DISCOVERY

**Document:** docs/approvals/0144-phase9-slice2-document-generation-specification-discovery.md
**Status:** SPECIFICATION DISCOVERY COMPLETE
**Date:** 2026-08-28

## 1. Slice 1 Completion Baseline
**Source:** `0139-phase9-slice1-storage-foundation-implementation-report.md`, `0143-phase9-slice1-storage-foundation-private-store-report.md` (IMPLEMENTED EVIDENCE)
The Storage Foundation (Phase 9 Slice 1) is completely implemented and verified. The `VercelBlobAdapter` operates over a Vercel Blob Private Store, enforcing strict `access: 'private'` uploads and explicitly generating time-bounded signed URLs for access. Document Immutability foundations at the infrastructure level are stable.

## 2. Roadmap Evidence
**Source:** `0134-post-phase8-strategic-architecture-gate.md`, `0133-phase8-post-slice4-next-approved-work-discovery.md` (AUTHORITATIVE)
The Canonical Roadmap establishes Phase 9 as "Documents & Communication." `0134` established that Phase 9 should be broken into distinct execution slices.

## 3. Next Slice Identification
**Source:** `0134-post-phase8-strategic-architecture-gate.md` (AUTHORITATIVE)
The next logical slice is explicitly named: "Phase 9 Slice 2: Document Generation (Immutable PDF invoices, Quotes, `OrderDocument` database schema)." However, `0133` previously established that no detailed, approved implementation plan or specification exists for this slice yet.

## 4. Document Generation Origin
**Source:** `0047-phase6-slice5-invoice-accounting-specification.md`, `0008-phase3-repository-data-architecture-mapping.md` (AUTHORITATIVE)
The conceptual origin of "Document Generation" lies in Phase 3 Architecture and was deeply formalized in Phase 6 Slice 5. `0047` established the `OrderDocument` JSON snapshot model for invoices, deferring physical PDF generation to Phase 9.

## 5. Document Types
**Source:** `0134-post-phase8-strategic-architecture-gate.md` (AUTHORITATIVE)
- **Advance Invoice**: EXPLICITLY REQUIRED
- **Initial Quote**: EXPLICITLY REQUIRED
- **Payment Receipt**: EXPLICITLY REQUIRED (also mentioned in `0136`)
- **Order Confirmation**: DEFERRED / UNSPECIFIED
- **Custom Request Document**: DEFERRED / UNSPECIFIED
- **Refund Note**: DEFERRED (depends on unbuilt financial mechanics)

## 6. Financial Document Requirements
**Source:** `0047-phase6-slice5-invoice-accounting-specification.md` (AUTHORITATIVE)
- **Immutable Artifact**: JSON snapshot strictly enforced, physical PDF immutability required.
- **Version**: `templateVersion` field exists on `OrderDocument`.
- **Checksum**: Required conceptually (from `0136` immutability principles) but not yet in schema.
- **IssuedAt**: Handled via `OrderDocument.createdAt`.
- **Document Number**: `referenceIdentity` field.
- **Financial Totals / Snapshot**: `snapshot` JSON field.
- **Payment Status**: Derived dynamically via `SUM(COMPLETED PaymentRecord.amount)`, NOT statically locked into the invoice.

## 7. Storage Integration
**Source:** `0136-phase9-vercel-blob-storage-architecture-adr.md`, `0143-phase9-slice1-storage-foundation-private-store-report.md` (AUTHORITATIVE)
Generated PDFs must be uploaded via `StorageAdapter.upload()` with `access: 'private'`. Retrieval must use `StorageAdapter.getSignedUrl()`. Physical PDF blobs must be strictly immutable. How the `storageKey` is saved in the database is currently an architectural gap (not present in `OrderDocument` schema).

## 8. Snapshot / Consistency
**Source:** `0047-phase6-slice5-invoice-accounting-specification.md` (AUTHORITATIVE)
The architecture demands absolute immutability. An `OrderDocument` must freeze the order state (prices, discounts, shipping, customer details) at the exact moment of issuance. Dynamic regeneration of a PDF from current mutable database state is explicitly prohibited as it violates financial immutability.

## 9. Document Numbering
**Source:** `0047-phase6-slice5-invoice-accounting-specification.md` (AUTHORITATIVE)
- **Format**: `INV-{OrderNumber}-{Sequence}`.
- **Sequence**: Monotonic integer strictly scoped per order, secured by row-level locking.

## 10. PDF Technology
**Source:** `src/lib/pdfGenerator.ts` (IMPLEMENTED EVIDENCE)
The repository currently contains a prototype using `pdfkit`. The prototype uses legacy hardcoded calculations (`advanceRequired = order.total * 0.2`).

## 11. Template System
**Source:** `src/lib/pdfGenerator.ts` (IMPLEMENTED EVIDENCE)
The current prototype relies on `getSiteConfig()` and a `BrandService` to inject company information, address, and support emails into the PDF.

## 12. RootGrain Business Data
**Source:** `0134-post-phase8-strategic-architecture-gate.md` (AUTHORITATIVE)
Order, OrderItem, Customer, and StoreSettings are available. Phase 8 finalized the mathematics for Orders, rendering them structurally ready for final documentation.

## 13. Price Revision Intersection
**Source:** `0134-post-phase8-strategic-architecture-gate.md` (AUTHORITATIVE)
Because Phase 8 Slice 4 finalized Price Revisions, the math is now stable. Generation logic must snapshot the exact revised total and advance at the moment the document is created.

## 14. Payment Intersection
**Source:** `0047-phase6-slice5-invoice-accounting-specification.md` (AUTHORITATIVE)
Payment Records are the absolute source of truth. Payments strictly MUST NOT mutate the invoice JSON. The `OrderDocument.id` is linked to payments via `PaymentRecord.invoiceDocumentId`.

## 15. RBAC
**Source:** `0134-post-phase8-strategic-architecture-gate.md` (AUTHORITATIVE)
Phase 8 RBAC is capable of handling document permissions. Explicit permissions (e.g., `document.view`, `document.download`) will need to be formally defined, requiring simple database inserts and UI boundary checks.

## 16. Document Lifecycle
**Source:** `0047-phase6-slice5-invoice-accounting-specification.md` (AUTHORITATIVE)
The defined state machine for Invoices is `ISSUED -> VOIDED`. Voiding an invoice prevents new payments but does not delete the snapshot.

## 17. Immutability
**Source:** `0047-phase6-slice5-invoice-accounting-specification.md`, `0136-phase9-vercel-blob-storage-architecture-adr.md` (AUTHORITATIVE)
"Immutability" means the JSON snapshot never changes, and the physical PDF in Vercel Blob is never overwritten or silently replaced. Re-generation requires a strict versioning or explicit superseding mechanism (DEFERRED).

## 18. Generation Trigger
**Source:** `0134-post-phase8-strategic-architecture-gate.md` (AUTHORITATIVE)
**UNSPECIFIED**. Listed as an explicit Open Architectural Decision ("When exactly is an invoice PDF generated?").

## 19. Generation Model
**Source:** `0134-post-phase8-strategic-architecture-gate.md` (AUTHORITATIVE)
**UNSPECIFIED**. Listed as an explicit Open Architectural Decision (synchronous vs asynchronous).

## 20. Failure Model
**Source:** `0136-phase9-vercel-blob-storage-architecture-adr.md` (AUTHORITATIVE)
If DB commits fail after a blob upload, the blob is orphaned and swept later. If blob upload fails, the DB transaction must rollback.

## 21. UI Scope
**Source:** `0134-post-phase8-strategic-architecture-gate.md` (AUTHORITATIVE)
- Admin UI for viewing generated documents (FUTURE / Slice 2)
- Customer UI for downloading invoices (FUTURE / Slice 2)

## 22. UAT Implications
**Source:** INFERRED FROM SLICE 1 & 0047
Future UAT must validate: PDF totals perfectly match JSON snapshots, signed URL access works securely, PDF generation failure gracefully rolls back, and no unauthorized direct access occurs.

## 23. Dependencies
**Source:** `0134-post-phase8-strategic-architecture-gate.md` (AUTHORITATIVE)
Depends purely on Storage Foundation (COMPLETED). Does NOT depend on QC/Dispatch, Refunds, or Double-Entry Accounting.

## 24. Exact Scope if Authoritative
**UNSPECIFIED**. While the slice is named, a rigid implementation boundary defining exactly what will be built in Slice 2 is missing.

## 25. Architectural Gaps
- **Storage Association**: `OrderDocument` lacks a field for the Vercel Blob `storageKey` or `checksum`.
- **Generation Trigger**: When is the PDF generated?
- **Generation Model**: Synchronous or Queue-based?
- **PDF Technology**: Does `pdfkit` remain the standard, or do we use React-PDF / HTML-to-PDF?
- **Receipts & Quotes**: `OrderDocument` currently only formally supports `INVOICE` logic. Are Receipts generated as separate `OrderDocument` rows or purely dynamic?

## 26. Next Decision
**B. Slice 2 architecture/specification must be created first.**
The repository knows *what* Phase 9 Slice 2 is, but lacks the approved architectural specification detailing *how* to implement it securely.

## FINAL STATUS
PHASE 9 SLICE 2 NOT YET AUTHORITATIVELY SPECIFIED
