# 0146-PHASE9-SLICE2-DOCUMENT-GENERATION-TECHNICAL-SPIKE

**Document:** docs/approvals/0146-phase9-slice2-document-generation-technical-spike.md
**Status:** TECHNICAL SPIKE REPORT
**Date:** 2026-08-28

## 1. CURRENT VERCEL / NEXT.JS ARCHITECTURE
**VERIFIED PLATFORM BEHAVIOR:**
- **Next.js Version:** `^16.1.1` (from `package.json`).
- **Runtime:** Node is the default; no Edge runtime forced globally.
- **Async Mechanisms:** `inngest` (`^4.13.0`) is installed and initialized in `src/inngest/client.ts`, but **NO API ROUTE** (`api/inngest/route.ts`) exists to process events. Thus, there is no active durable queue.

## 2. POST-COMMIT GENERATION
**AUTHORITATIVE:**
Financial DB commit MUST NOT depend on PDF generation. The flow must be:
DB COMMIT -> Trigger generation -> Generate PDF -> Hash -> Upload -> Update DB.

## 3. EVALUATE waitUntil
**VERIFIED PLATFORM BEHAVIOR:**
- `waitUntil` is natively available in Next.js 15+ (via `next/server` `unstable_after`) and via `@vercel/functions`.
- It executes in the background for the duration of the function's max execution timeout.
- **Durability:** It is **NOT** a durable queue. If the function instance crashes, times out, or the Vercel Blob upload fails, the task is lost.
- **Retry:** No built-in retry behavior.
- **Visibility:** Failures are only visible in Vercel runtime logs.

## 4. EVALUATE EXISTING ORDER EVENT ARCHITECTURE
**IMPLEMENTED EVIDENCE:**
- `OrderEvent` exists in the database schema.
- `src/inngest/client.ts` defines an `"order/confirmation.requested"` event.
- However, there is no webhook handler to consume these events.
**VERDICT:** NO DURABLE BACKGROUND WORKER CURRENTLY EXISTS.

## 5. VERCEL CRON
**IMPLEMENTED EVIDENCE:**
- `vercel.json` exists but does not contain a `crons` array.
- Vercel Cron is not currently used. It could safely support a polling/retry worker (polling `OrderDocument` where `storageKey` is null), but it is not implemented.

## 6. EXTERNAL QUEUE
**IMPLEMENTED EVIDENCE:**
- `inngest` package is installed but unconfigured (no API receiver).
- EXTERNAL QUEUE NOT CURRENTLY PRESENT.

## 7. RECOMMEND ASYNC MODEL
**RECOMMENDED:**
**D. New background infrastructure is required.**
Because `waitUntil` lacks retry and durability, a failure in PDF generation or Blob upload will result in a permanent failure state for the physical document without automatic recovery. To satisfy the requirement that financial commits remain decoupled and PDFs reliably generate, a durable queue (like fully configuring the installed `Inngest`) or a Cron polling mechanism must be introduced.

## 8. FAILURE / RETRY
**UNRESOLVED / VERIFIED PLATFORM BEHAVIOR:**
Using `waitUntil`:
- **PDF generation failure:** Work is lost. No retry.
- **Blob upload failure:** Work is lost. No retry.
- **DB update failure:** Blob becomes orphaned in Vercel Blob.
- **Duplicate trigger:** Will execute twice in parallel unless DB locks are used.

## 9. IDEMPOTENCY
**RECOMMENDED:**
Checking `storageKey != null` is a good first step, but a race condition exists if two background triggers read the `OrderDocument` simultaneously.
A database uniqueness/locking mechanism (e.g., atomic `update` with `where: { storageKey: null }`) is required.

## 10. RECEIPT SCHEMA
**IMPLEMENTED EVIDENCE:**
- `OrderDocument` uniqueness: `@@unique([documentType, referenceIdentity])`.
- `PaymentRecord` primary key: `id` (cuid).
- `PaymentRecord` uniqueness: `@@unique([orderId, type])` (Note: `type` is an enum, e.g., `ADVANCE`, `INSTALLMENT`, `COD`, so an order can only have one `ADVANCE` payment).
One payment -> one receipt IS enforceable by setting `OrderDocument.referenceIdentity` to the `PaymentRecord.id`.

## 11. RECEIPT IDENTITY
**RECOMMENDED:**
`RCT-{PaymentId}` can be safely represented as `referenceIdentity`.
Since `PaymentId` is a CUID (globally unique), the composite string `RCT-{PaymentId}` is globally unique and safely satisfies the `@@unique([documentType, referenceIdentity])` constraint on `OrderDocument`.

## 12. RECEIPT DOCUMENT RELATIONSHIP
**IMPLEMENTED EVIDENCE:**
`PaymentRecord` does NOT need a `receiptDocumentId`.
`OrderDocument.referenceIdentity` storing the Payment ID is sufficient to resolve the relationship in queries.

## 13. INVOICE NUMBERING
**VERIFIED PLATFORM BEHAVIOR:**
`INV-{OrderNumber}-{Sequence}`
The current Prisma schema supports `orderNumber` (which is auto-generated), but there is no native sequence counter for documents per order. Row-level locking or a separate sequence tracking mechanism does not currently exist for document sequences.

## 14. QUOTE STATUS
**IMPLEMENTED EVIDENCE:**
The current repository does not contain business logic for Quotes.
Quote generation remains OUT OF SCOPE.

## 15. PDFKIT VERIFICATION
**IMPLEMENTED EVIDENCE:**
- `pdfkit` is installed (`^0.19.1`).
- Used in `src/lib/pdfGenerator.ts`.
- It is Node-runtime compatible.

## 16. LEGACY CALCULATION
**IMPLEMENTED EVIDENCE:**
The legacy calculation `advanceRequired = order.total * 0.2` exists in the following exact locations:
- `src/lib/pdfGenerator.ts` (Lines 96-97)
- `src/lib/email.ts` (Line 145, 186)
- `src/app/(storefront)/checkout/page.tsx` (Lines 124, 381)
- `src/app/(storefront)/checkout/mto/MtoCheckoutClient.tsx` (Lines 123, 344 - Note: This one uses 0.50 for MTO)

## 17. TEMPLATE VERSION
**IMPLEMENTED EVIDENCE:**
- Persisted in `OrderDocument`.
- Existing defaults: `templateVersion: "1.0"` is hardcoded in `src/services/payment.service.ts` and `src/services/mto-admin.service.ts` and `src/lib/persistence/orderDocument.ts` when documents are created.

## 18. STORE SETTINGS SNAPSHOT
**IMPLEMENTED EVIDENCE:**
The Prisma `StoreSettings` model only tracks cart/maintenance data (`abandonedCartDelayHours`, `abandonedCartDiscountPercent`, `maintenanceMode`).
Branding data (Company Name, Address, Phone, Email) comes from `src/data/site-config.ts` (hardcoded config object).
**RECOMMENDED:** This configuration object must be frozen into the JSON snapshot to preserve historical integrity.

## 19. FINAL ARCHITECTURAL VERDICT
**VERDICT:**
**B. NO — background execution architecture unresolved.**

**Reasoning:** 
While the data model and schema support exactly what is required for Receipts and Invoices, the execution platform lacks a durable queue. Relying on `waitUntil` violates the immutability/reliability mandate because a failed upload cannot be retried. The background execution architecture must be resolved (e.g., completing the `Inngest` integration or setting up Vercel Cron) before document generation can be safely implemented.

## FINAL STATUS
**PHASE 9 SLICE 2 — TECHNICAL SPIKE IDENTIFIED BLOCKERS**
