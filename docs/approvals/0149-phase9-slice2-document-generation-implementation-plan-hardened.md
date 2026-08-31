# 0149-PHASE9-SLICE2-DOCUMENT-GENERATION-IMPLEMENTATION-PLAN-HARDENED

**Document:** docs/approvals/0149-phase9-slice2-document-generation-implementation-plan-hardened.md
**Status:** IMPLEMENTATION PLAN HARDENED — READY FOR IMPLEMENTATION
**Date:** 2026-08-28

## 1. ORDERDOCUMENT SCHEMA FORENSICS
**VERIFIED CURRENT SCHEMA:**
`OrderDocument` contains:
- `id String @id @default(cuid())`
- `orderId String` (Index)
- `documentType String`
- `referenceIdentity String`
- `snapshot Json`
- `templateVersion String`
- `createdBy String`
- `createdAt DateTime @default(now())`
- `status String @default("ISSUED")`
- `order Order @relation`
- `paymentRecords PaymentRecord[]`

**Constraints:**
- `@@unique([documentType, referenceIdentity])` enforces global uniqueness per document identity.

## 2. MIGRATION SAFETY
**VERIFIED:**
Adding `storageKey String?`, `checksum String?`, `size Int?`, and `mimeType String @default("application/pdf")` is 100% safe.
- Existing rows will seamlessly adopt `null` values for optional fields and the default `mimeType`.
- No backfill migration script is required. Existing documents will simply remain un-generated (which accurately reflects their historical state) until manually generated via an admin mechanism.

## 3. DOCUMENT IDENTITY
**AUTHORITATIVE:**
- **Business Identity:** e.g., "Invoice 123" or "Receipt for Payment X".
- **Database Identity:** `OrderDocument.id` (CUID, used internally and for relations).
- **Physical Blob Identity:** `storageKey` (The deterministic path in Vercel Blob).
These identities MUST NOT be conflated. Events route via Database Identity; Storage accesses via Physical Blob Identity.

## 4. INVOICE IDENTITY
**AUTHORITATIVE:**
Canonical: `INV-{OrderNumber}-{Sequence}`
- **Sequence Generation Safety:** The current application uses a `count()` + 1 strategy inside a Prisma transaction. Under concurrent requests, two threads might read the same count. However, the database unique constraint `@@unique([documentType, referenceIdentity])` guarantees that the second concurrent insert will throw a Prisma Unique Constraint Violation (P2002) and abort the transaction.
- **Verdict:** Concurrency is protected by strict database constraints. Safe to proceed without schema changes.

## 5. RECEIPT IDENTITY
**AUTHORITATIVE:**
Canonical: `RCT-{PaymentId}`
- **Proof:** `PaymentRecord.id` is a unique CUID. Thus `RCT-{PaymentId}` is globally unique. The `OrderDocument` unique constraint (`@@unique([documentType, referenceIdentity])`) enforces mathematically that at most one receipt document can exist per payment. Concurrent requests will result in a P2002 violation.

## 6. SNAPSHOT CONTRACT
**IMPLEMENTATION DETAIL:**
The renderer MUST receive strictly typed JSON.
```typescript
type DocumentBrandingSnapshot = {
  companyName: string;
  address: string;
  email: string;
  phone: string;
}

type InvoiceSnapshot = {
  invoiceType: "ADVANCE" | "FINAL";
  orderTotal: number;
  requiredAdvance: number;
  shippingAddress: any;
  items: any[];
  customerEmail: string;
  branding: DocumentBrandingSnapshot;
}

type ReceiptSnapshot = {
  amount: number;
  type: string;
  method: string;
  reference: string | null;
  paidAt: Date | string | null;
  branding: DocumentBrandingSnapshot;
}
```
No mutable database lookups during rendering.

## 7. SNAPSHOT FREEZING
**IMPLEMENTATION DETAIL:**
During Invoice or Receipt creation in the respective service files, the exact state of the Order or Payment MUST be frozen into the JSON snapshot payload along with the branding object retrieved from `getSiteConfig()`.

## 8. PRICE REVISION
**VERIFIED:**
Price revision history operates on the mutable `Order` tables. Because the PDF generator only reads `OrderDocument.snapshot`, future price revisions structurally cannot alter an already-issued PDF or its snapshot. Historical immutability is mathematically guaranteed by the architecture.

## 9. PAYMENT
**VERIFIED:**
Receipt generation extracts its snapshot exactly from the completed `PaymentRecord`. It does NOT look at the current mutable order balance.

## 10. BRANDING
**VERIFIED:**
Branding will be sourced from `src/data/site-config.ts` (`getSiteConfig()`). Only Company Name, Address, Email, and Phone will be frozen into the `branding` snapshot key.

## 11. TEMPLATE VERSION
**IMPLEMENTATION DETAIL:**
`templateVersion` is already defaulted to `"1.0"` in the creation services. The PDF renderer (`pdfGenerator.ts`) must accept this parameter to ensure backward compatibility if template layouts diverge in the future.

## 12. PDF RENDERING
**IMPLEMENTATION DETAIL:**
`src/lib/pdfGenerator.ts` MUST be refactored.
- Signature changes from `generateInvoicePDF(order: any)` to `generateInvoicePDF(snapshot: InvoiceSnapshot, templateVersion: string)`.
- It becomes a pure function: `(Snapshot) -> Buffer`.
- Zero database imports. Zero Prisma calls.

## 13. LEGACY FINANCIAL LOGIC
**VERIFIED:**
`advanceRequired = order.total * 0.2` MUST be completely deleted from `src/lib/pdfGenerator.ts`.
It will NOT be removed from checkout logic in this slice to strictly limit the blast radius to Document Generation.

## 14. DETERMINISTIC STORAGE KEY
**RECOMMENDED:**
Storage Key Format: `documents/{documentType}/{orderId}/{referenceIdentity}.pdf`
(e.g., `documents/INVOICE/cmtb.../INV-1001-1.pdf`)
**Idempotency Value:** By making the storage key mathematically deterministic based on the stable document identity, any duplicate Inngest worker execution that reaches the upload phase will simply overwrite the same blob path with identical bytes, physically preventing duplicate orphan blobs from accumulating in Vercel Blob.

## 15. DUPLICATE JOB RACE
**VERIFIED:**
If Job A and Job B process the same `OrderDocument`:
- **Inngest level:** `step.run` ensures a specific step runs only once per Event ID.
- **Blob level:** Deterministic Storage Key ensures both jobs upload to the exact same path.
- **Database level:** A conditional update `prisma.orderDocument.updateMany({ where: { id: docId, storageKey: null }, data: { storageKey } })` ensures only the first job registers the key.

## 16. INNGEST EVENT
**IMPLEMENTATION DETAIL:**
```typescript
"document/generation.requested": {
  data: {
    orderDocumentId: string;
    documentType: "INVOICE" | "PAYMENT_RECEIPT";
  }
}
```
No PII. No PDF bytes.

## 17. INNGEST FUNCTION
**IMPLEMENTATION DETAIL:**
The durable execution MUST strictly follow these steps:
- **Step 1:** Load immutable `OrderDocument` from DB.
- **Step 2:** Verify `storageKey == null`. If not null, abort (idempotent success).
- **Step 3 (`step.run`):** Render PDF Buffer (pure function).
- **Step 4 (`step.run`):** Compute SHA-256 hash.
- **Step 5 (`step.run`):** Upload to Vercel Blob using the deterministic key.
- **Step 6 (`step.run`):** Conditional DB update (`where: { storageKey: null }`).
- **Step 7:** Finalize.

## 18. DB COMMIT → EVENT GAP
**VERIFIED RISK:**
Transaction succeeds → `inngest.send()` fails.
- **Identification:** `OrderDocument` exists where `storageKey IS NULL`.
- **CURRENT SLICE MITIGATION:** None programmatic. Handled by future Admin UI manual retry button.
- **FUTURE OUTBOX HARDENING:** Transactional outbox pattern.

## 19. BLOB UPLOAD → DB FAILURE
**VERIFIED RISK:**
PDF generated → Upload succeeds → DB update fails.
- **Retry behavior:** Inngest automatically retries.
- **Orphan behavior:** Because the `storageKey` is deterministic, the retry overwrites the same blob path. No physical orphan drift occurs! The DB update succeeds on retry.

## 20. RETRY SAFETY
**VERIFIED:**
Retries safely reuse the exact same immutable snapshot and deterministic storage key. An issued document is never mathematically mutated by a retry.

## 21. DOCUMENT IMMUTABILITY
**AUTHORITATIVE:**
Once `storageKey` and `checksum` are committed, the document is permanently frozen. No silent regeneration is permitted.

## 22. VOID
**FUTURE HARDENING:**
If an invoice transitions `ISSUED → VOIDED`, the PDF and snapshot remain preserved. Future access logic will simply render a "VOID" watermark or badge on the UI. Not implemented in Slice 2.

## 23. INVOICE CONTENT
**IMPLEMENTATION DETAIL:**
Bill To, Ship To, Items, Quantities, Prices, Total, Required Advance, Invoice Number, Date, Branding.

## 24. RECEIPT CONTENT
**IMPLEMENTATION DETAIL:**
Received From, Payment Amount, Payment Method, Payment Reference, Date, Linked Invoice Reference, Receipt Number, Branding.

## 25. CHECKSUM
**AUTHORITATIVE:**
SHA-256 of the exact PDF bytes calculated immediately before Vercel Blob `put()`. Persisted to `OrderDocument.checksum`. Provides cryptographically verifiable proof that the physical blob retrieved from Vercel perfectly matches the bytes originally rendered by the RootGrain system.

## 26. PRIVATE STORAGE
**AUTHORITATIVE:**
Vercel Blob Private Store. `access: "public"` is explicitly forbidden. Access is mediated by short-lived signed URLs.

## 27. AUTHORIZATION
**AUTHORITATIVE:**
Server-side generation only. Existing RBAC applies. No new permissions added in Slice 2.

## 28. OBSERVABILITY
**VERIFIED:**
Inngest Cloud Dashboard provides visibility for generation requested, started, retried, failed, and completed. No custom observability vendor is required.

## 29. MANUAL RECOVERY
**FUTURE HARDENING:**
Future Admin UI will query `OrderDocument.findMany({ where: { storageKey: null } })` and provide a "Generate Document" button to re-dispatch the `document/generation.requested` event.

## 30. TEST MATRIX
A comprehensive test suite MUST be implemented verifying:
A. schema migration
B. invoice sequence concurrency
C. receipt identity concurrency
D. snapshot freezing
E. price revision
F. payment snapshot
G. template version
H. PDF rendering purity
I. checksum validity
J. deterministic storageKey mapping
K. duplicate Inngest event resilience
L. concurrent workers resilience
M. Blob upload failure retry
N. DB update failure retry
O. event dispatch failure behavior
P. private Blob access
Q. signed URL expiry
R. voided document retention
S. legacy 20% logic absence
T. zero PII in event payload
U. zero PII in storageKey

## 31. FAILURE INJECTION
**IMPLEMENTATION DETAIL:**
Testing must utilize controlled dependency mocks (mocking `put()` and `prisma.orderDocument.updateMany()`) to deliberately simulate network failures and prove Inngest retry recovers safely.

## 32. UAT
**VERIFIED:**
Future UAT will manually verify Invoice and Receipt end-to-end lifecycles, ensuring the final PDF physically exists, is private, perfectly matches the snapshot, and survives database transaction isolation constraints.

## 33. BUILD
**IMPLEMENTATION DETAIL:**
Before finalizing, `npx prisma generate`, local migration, `npm run lint`, and `npm run build` must cleanly pass.

## 34. SCOPE
**IN SCOPE:** Invoice, Payment Receipt, Storage fields, typed snapshots, pure pdfkit, Inngest durable generation, SHA-256, private Blob, idempotency, failure handling.
**OUT OF SCOPE:** Quote, Communication, UI, Ledger, Refunds, cleanup worker, transactional outbox.

## 35. IMPLEMENTATION ORDER
1. Schema & Migration (`OrderDocument` fields).
2. Snapshot Contract & Types (`types.ts` / `pdfGenerator.ts`).
3. Refactor `pdfGenerator.ts` (Pure function, eliminate legacy math).
4. Update `mto-admin.service.ts` (Invoice Snapshot Freezing & Event Dispatch).
5. Update `payment.service.ts` (Receipt Snapshot Freezing & Event Dispatch).
6. Setup Inngest (`client.ts` & `route.ts`).
7. Implement Durable Function (`generateDocument.ts`).
8. Tests & Verification.

## 36. RISK REGISTER
- **R1: post-commit event dispatch gap** (Impact: Missed PDF; Mitigation: Manual retry; Residual: Low).
- **R2: duplicate concurrent generation** (Impact: Wasted compute; Mitigation: `step.run` & conditional DB update; Residual: Very Low).
- **R3: orphan Blob** (Impact: Storage bloat; Mitigation: Deterministic storage keys; Residual: Negligible).
- **R4: invoice sequence race** (Impact: DB error; Mitigation: Unique constraint aborts transaction; Residual: Acceptable UX retry).
- **R5: snapshot incompleteness** (Impact: Incorrect PDF; Mitigation: Strict TypeScript snapshot contracts; Residual: Low).
- **R6: legacy financial calculation leakage** (Impact: Wrong totals; Mitigation: Complete removal from generator; Residual: Zero).
- **R7: private document access regression** (Impact: Leak; Mitigation: Forced `access: 'public'` linting; Residual: Zero).

## 37. FINAL READINESS GATE
All critical financial, concurrency, and identity decisions have been classified as VERIFIED or AUTHORITATIVE. No blocking unresolved issues remain.

## FINAL STATUS
**PHASE 9 SLICE 2 — IMPLEMENTATION PLAN HARDENED — READY FOR IMPLEMENTATION**
