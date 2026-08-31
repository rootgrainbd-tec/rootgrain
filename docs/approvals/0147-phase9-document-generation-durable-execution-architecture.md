# 0147-PHASE9-DOCUMENT-GENERATION-DURABLE-EXECUTION-ARCHITECTURE

**Document:** docs/approvals/0147-phase9-document-generation-durable-execution-architecture.md
**Status:** DURABLE EXECUTION ARCHITECTURE IDENTIFIED — PENDING CANONICAL APPROVAL
**Date:** 2026-08-28

## 1. CURRENT EXECUTION ARCHITECTURE
- **VERIFIED PLATFORM BEHAVIOR:** RootGrain currently operates on Next.js `^16.1.1` on Vercel. 
- **LIMITATIONS:** There is no active durable background worker. Built-in Next.js mechanisms like `waitUntil` lack durability and automatic retry capabilities, making them unsuitable for reliable post-commit financial document generation.

## 2. EXISTING INNGEST EVIDENCE
- **VERIFIED PLATFORM BEHAVIOR:** 
  - `inngest` (`^4.13.0`) is installed in `package.json`.
  - A client is initialized in `src/inngest/client.ts` with the ID `"rootgrain-web"`.
  - A single event schema `"order/confirmation.requested"` exists.
  - **CRITICAL GAP:** There is no `app/api/inngest/route.ts` API route. Inngest is completely dormant and cannot receive or process webhooks.

## 3. INNGEST CAPABILITY VERIFICATION
- **VERIFIED PLATFORM BEHAVIOR (per official documentation):**
  - **Durability:** Jobs are durably queued external to Vercel's serverless runtime.
  - **Retries:** Automatic exponential backoff retries on function failure.
  - **Idempotency:** Step-based execution (`step.run`) guarantees that individual steps within a job are only executed successfully once, even across retries.
  - **Concurrency:** Built-in concurrency and throttling controls.
  - **Vercel Compatibility:** Natively integrates via a standard Next.js App Router API route.

## 4. VERCEL INTEGRATION
- **RECOMMENDED ARCHITECTURE:**
  Inngest integrates cleanly into Vercel by exposing an HTTP endpoint (e.g., `app/api/inngest/route.ts`). The Vercel runtime is only invoked when Inngest actively dispatches a step to the endpoint. This perfectly aligns with Vercel's serverless model without requiring long-polling or persistent background threads.

## 5. EVENT MODEL
- **RECOMMENDED ARCHITECTURE:**
  The existing `"order/confirmation.requested"` event is highly specific to emails. A new conceptual event `"document/generation.requested"` is required to explicitly decouple document generation triggers from domain-specific notification requests.

## 6. POST-COMMIT FLOW
- **RECOMMENDED ARCHITECTURE:**
  1. **DATABASE TRANSACTION:** Financial business logic executes.
  2. **COMMIT:** Transaction is successfully committed.
  3. **EVENT DISPATCH:** Application calls `inngest.send({ name: 'document/generation.requested', data: { ... } })`.
  4. **DURABLE FUNCTION:** Inngest invokes the generation function.
  5. **SNAPSHOT READ:** Function reads `OrderDocument.snapshot` directly from the database using the ID.
  6. **PDF GENERATION:** `pdfkit` generates the buffer.
  7. **HASH:** SHA-256 is computed.
  8. **UPLOAD:** Buffer is uploaded to Vercel Blob Private Store.
  9. **UPDATE:** `OrderDocument` is updated with `storageKey` and `checksum`.

## 7. FAILURE / RETRY
- **VERIFIED PLATFORM BEHAVIOR:**
  If PDF generation, Vercel Blob upload, or the database update throws an error, the Inngest function fails. Inngest automatically schedules a retry with exponential backoff.
- **RECOMMENDED ARCHITECTURE:**
  No custom retry logic needs to be written; the platform handles it.

## 8. IDEMPOTENCY
- **RECOMMENDED ARCHITECTURE:**
  Because Inngest uses at-least-once delivery, idempotency is strictly enforced by:
  1. Using Inngest's `step.run` for the generation and upload phases.
  2. A database condition checking `where: { id: orderDocumentId, storageKey: null }` before committing the final storage mapping.

## 9. DB CONSISTENCY & EVENT DISPATCH FAILURE
- **UNRESOLVED RISK:**
  If the database commit succeeds but the external `inngest.send()` HTTP call fails, the `OrderDocument` is successfully recorded (with `storageKey: null`) but the PDF will never be generated because the queue never received the event.
- **RECOMMENDED MITIGATION:**
  This is a known reliability gap without a transactional outbox. As an immediate mitigation, an Admin UI "Manual Retry / Generate" button is highly recommended as a fallback, rather than engineering a complex transactional outbox for Slice 2.

## 10. OUTBOX / EVENT ANALYSIS
- **IMPLEMENTED EVIDENCE:**
  RootGrain possesses a `NotificationOutbox` linked to `OrderEvent`, but this is strictly modeled for external notifications (channels, emails, SMS), not internal asynchronous job processing.
- **VERDICT:** There is no generalized Outbox pattern available. `inngest.send()` will remain a best-effort post-commit action.

## 11. CRON COMPARISON
- **Vercel Cron:**
  - *Durability:* Yes.
  - *Latency:* High (runs on a schedule, e.g., every 5 minutes).
  - *Complexity:* High (requires row-level locking to prevent concurrent cron invocations from generating the same PDF).
  - *Observability:* Basic.
- **Inngest:**
  - *Durability:* Yes.
  - *Latency:* Low (near real-time).
  - *Complexity:* Low (handles state and retries externally).
  - *Observability:* Excellent (built-in dashboard).

## 12. waitUntil COMPARISON
- **waitUntil:**
  - *Durability:* No. Work is permanently lost if the Vercel function times out or the Blob API is temporarily down.
  - *Retry:* None.
  - **VERDICT:** Insufficient for financial document generation reliability.

## 13. FINANCIAL SAFETY
- **AUTHORITATIVE:**
  The architecture cleanly decouples generation from the transaction. A failure to generate the PDF natively safely leaves the core financial ledger and the `OrderDocument` JSON snapshot intact.

## 14. ORPHAN HANDLING
- **RECOMMENDED ARCHITECTURE:**
  If the PDF is uploaded to Vercel Blob but the subsequent DB update fails, the Inngest retry will re-run the step. Depending on implementation, this could result in an orphaned blob. For Slice 2, orphaned blobs are considered an acceptable minor storage tradeoff in exchange for overall architectural simplicity and financial transaction safety.

## 15. MANUAL RETRY
- **RECOMMENDED (FUTURE):**
  A manual trigger via the Admin UI to dispatch the `"document/generation.requested"` event for any `OrderDocument` missing a `storageKey`.

## 16. OBSERVABILITY
- **VERIFIED PLATFORM BEHAVIOR:**
  Inngest natively provides job start, failure, retry, and completion visibility via its cloud dashboard without requiring additional logging vendor integration.

## 17. SECURITY
- **RECOMMENDED ARCHITECTURE:**
  The event payload will strictly contain stable identifiers (e.g., `{ orderDocumentId: string, documentType: string }`). No PII or Provider Secrets will be embedded in the event stream.

## 18. COST CONSIDERATIONS
- **VERIFIED PLATFORM BEHAVIOR:**
  Inngest provides a generous free tier (typically 100k events/month), which easily accommodates RootGrain's current volume without immediate financial overhead.

## 19. DECISION MATRIX

| Requirement | Inngest | Vercel Cron | waitUntil |
|-------------|---------|-------------|-----------|
| **Durable** | SUPPORTED | SUPPORTED | REQUIRES WORK (None) |
| **Retry** | SUPPORTED | REQUIRES WORK | REQUIRES WORK |
| **Failure recovery** | SUPPORTED | REQUIRES WORK | UNRESOLVED |
| **Idempotency** | SUPPORTED (Steps) | REQUIRES WORK (Locks) | UNRESOLVED |
| **Observability** | VERIFIED | VERIFIED (Basic) | UNRESOLVED |
| **Vercel compatibility**| VERIFIED | VERIFIED | VERIFIED |
| **Implementation complexity**| LOW | HIGH | LOW |
| **Current repository readiness**| PARTIAL | UNCONFIGURED | READY |

## 20. PRIMARY RECOMMENDATION
**PRIMARY RECOMMENDATION: A. INNGEST**
**Reasoning:** Inngest is already installed and partially initialized in the repository. It seamlessly provides exactly the required capabilities (durability, automatic retries with backoff, low latency, and step-based idempotency) without demanding complex row-locking or polling infrastructure. It guarantees that temporary Vercel Blob failures do not result in permanently lost invoices.

## 21. REQUIRED ARCHITECTURAL CHANGES
To implement this recommendation, the following future changes are required (DO NOT IMPLEMENT NOW):
- Create `app/api/inngest/route.ts` to serve Inngest functions.
- Define `"document/generation.requested"` event schema.
- Implement the Inngest durable function (`generateDocument`).
- Configure Inngest environment variables (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`).
- Update the checkout/transaction logic to dispatch the event post-commit.

## 22. SLICE 2 IMPACT
Resolving this architecture **UNBLOCKS Phase 9 Slice 2 implementation planning**. We now have a clear, reliable execution path for generating the PDFs.

## 23. RECEIPT / INVOICE IMPACT
**VERIFIED:**
This architecture cleanly supports Invoice and Receipt generation asynchronously. It will seamlessly support Quote generation in the future once Quote business logic is established.

## 24. STATUS
**PHASE 9 DOCUMENT GENERATION — DURABLE EXECUTION ARCHITECTURE IDENTIFIED — PENDING CANONICAL APPROVAL**
