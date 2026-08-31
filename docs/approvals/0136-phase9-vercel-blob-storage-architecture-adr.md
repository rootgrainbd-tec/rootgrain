# 0136-PHASE9-VERCEL-BLOB-STORAGE-ARCHITECTURE-ADR

**Document:** docs/approvals/0136-phase9-vercel-blob-storage-architecture-adr.md

# Decision
RootGrain will use Vercel Blob as the intended object-storage provider.

# Status
PROPOSED — PENDING APPROVAL

# Context
RootGrain lacks an active storage infrastructure for customer uploads and immutable financial documents. Previous reconnaissance errors assumed AWS S3 was active, but an authoritative audit (`0135`) confirmed no storage integration exists. Because RootGrain is already hosted on Vercel, adopting the native Vercel Blob storage minimizes infrastructure sprawl and architectural friction. 

The initial deployment target is the **Vercel Blob free tier**. The architecture must be designed so that future storage growth does not require rewriting the application domain logic.

# Existing Evidence
Based on `0135-rootgrain-storage-source-of-truth-audit.md`:
- AWS S3 is NOT active RootGrain infrastructure.
- AWS S3 is NOT approved.
- Supabase Storage is NOT approved.
- Vercel Blob was explicitly recommended in Phase 7 (`0055`).
- RootGrain is currently hosted on Vercel.
- No storage provider is currently implemented.

# Decision Drivers
- **Hosting Alignment**: RootGrain is hosted on Vercel. Vercel Blob fits seamlessly into the Next.js/Vercel deployment model with minimal configuration.
- **Phase 7 Foundation**: Phase 7 explicitly recommended Vercel Blob over alternatives due to repository constraints.
- **Zero Existing Integration**: There is no existing AWS infrastructure or Supabase Storage code to refactor.

# Architecture
The storage foundation must support the following RootGrain use cases:
- **MVP REQUIRED**:
  - CustomRequestItem customer images (Unblocks Phase 7)
  - Invoice PDFs (Unblocks Phase 9)
  - Payment receipt PDFs (Unblocks Phase 9)
- **FUTURE**:
  - Order documents
  - Quote PDFs
  - Advance invoice PDFs
  - Other immutable financial documents

**Object Key Design**:
A deterministic object-key strategy must be proposed that considers environment, document type, order ID, document ID, and version.
*Crucial Constraint*: DO NOT use customer email, phone numbers, or other PII in object keys. Do not expose sequential sensitive identifiers unnecessarily in the storage paths.

# Security
Financial and customer documents MUST NOT be publicly accessible.
The design centers around:
1. Private objects at the bucket level.
2. Authenticated application authorization.
3. Short-lived signed access (presigned URLs generated dynamically on read).
Permanent public URLs will never be exposed for private documents.

# Storage Lifecycle
Storage objects must be rigorously managed to prevent orphaned blobs. The application must track references in the database, and cron jobs or event listeners must eventually clean up abandoned uploads (e.g., when a user starts a Custom Request but never submits it).

# File Validation
The architecture must mandate server-side validation during upload:
- MIME allowlist (e.g., `image/jpeg`, `application/pdf`).
- Extension validation.
- Actual file-type signature validation (magic bytes).
- Maximum file size limits.
- Filename sanitization.
- Malicious upload handling.
- Duplicate upload handling (idempotency or deduplication).

# Access Control
Storage authorization must be enforced by RootGrain's application authorization (RBAC), not by bucket-level policies.
- **Customer Boundaries**: Customers can only generate signed URLs for their own permitted documents.
- **Admin Boundaries**: Admins can access permitted order/customer documents.
- **Internal Boundaries**: Internal-only artifacts remain restricted.

# Immutability
Financial documents (e.g., Invoice PDFs) must be treated as immutable once issued (DOC-001).
The architecture should support:
- Version identity (rather than overwriting).
- Checksum/hash logging in the database.
- Immutable storage references.
- No silent replacement of financial records.
- Strict audit trails via `OrderEvent`.

# Consistency / Failure Handling
The system must safely handle distributed transactions between the database and Vercel Blob:
- **DB record created + Blob upload fails**: The system must rollback the database record or retry.
- **Blob upload succeeds + DB transaction fails**: The system must treat the uploaded object as an orphan and eventually clean it up.
The recommended pattern is to upload the blob first, obtain the reference, and then commit the database transaction, allowing orphaned blobs to be swept later if the DB fails.

# Local / Preview / Production Separation
Environment separation must be explicit. Local development should use a designated development namespace or local mock to prevent accidentally writing production objects or polluting the live bucket with test data. Storage objects must never accidentally cross environments.

# Free-Tier Governance
Initial storage usage must remain within the currently available Vercel Blob free-tier limits.
The architecture must include:
- Upload size limits.
- Usage and bandwidth monitoring.
- Document retention considerations.
- Storage growth awareness and cleanup policies for abandoned uploads.
- Explicit triggers for when a provider upgrade is required.

# Provider Abstraction
The business domain MUST NOT directly depend on Vercel Blob APIs. We require an application-level storage abstraction.
Candidate interface:
- `upload()`
- `download()`
- `getSignedUrl()`
- `delete()`
- `exists()`
This abstraction shields business logic (`Order`, `OrderItem`, `CustomRequest`) from vendor lock-in.

# Alternatives Considered
- **AWS S3**: Historical candidate only. Not an active infrastructure. No account or integration exists. Not selected.
- **Supabase Storage**: Earlier alternative mentioned in Phase 2. No integration exists. Not selected.

# Risks
- **Free-tier exhaustion**: Exceeding Vercel Blob's free quota for storage or bandwidth. (Mitigation: Implement strict size limits and monitoring).
- **Unexpected bandwidth usage**: Hotlinking or abusive downloads. (Mitigation: Short-lived signed URLs only).
- **Unauthorized downloads**: PII leakage. (Mitigation: RBAC application gate before generating URLs).
- **Public object exposure**: Misconfigured bucket. (Mitigation: Enforce private access explicitly).
- **Orphan objects**: Blobs left behind by failed DB transactions. (Mitigation: Scheduled cleanup script).
- **Malicious uploads**: Malware hosted on RootGrain infrastructure. (Mitigation: Strict MIME/extension/magic-byte validation).
- **Document replacement**: Silent modification of financial records. (Mitigation: Immutable versioning and DB checksums).
- **Environment leakage**: Local tests writing to production. (Mitigation: Strict `NODE_ENV` / bucket namespacing).
- **Vendor lock-in**: Tied to Vercel pricing. (Mitigation: The `StorageAdapter` abstraction layer).

# Migration Strategy
By using a `StorageAdapter` abstraction, future migration to AWS S3 (or any other S3-compatible provider) will only affect the adapter implementation, entirely sparing the `Order`, `Document`, and `Communication` domain logic.

# Phase 7 Impact
Approval of this ADR unblocks Phase 7 (Custom Requests) by providing a definitive storage target for `CustomRequestItem` images, resolving the explicitly deferred infrastructure task.

# Phase 9 Impact
Approval of this ADR enables the future Phase 9 execution sequence:
Storage Foundation → Document Generation → Documents → Communication.

# Open Questions
- **COST / FREE-TIER VERIFICATION**: CURRENT FREE-TIER LIMITS REQUIRE OFFICIAL VERCEL VERIFICATION BEFORE PRODUCTION CAPACITY PLANNING.
- **Orphan Cleanup Strategy**: Will we use a cron job or rely on manual sweeps initially?

# Approval Required
This document proposes Vercel Blob as the storage architecture. DO NOT PROCEED WITH IMPLEMENTATION. Waiting for canonical approval.
