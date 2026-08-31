# 0138-PHASE9-SLICE1-STORAGE-FOUNDATION-IMPLEMENTATION-PLAN-HARDENED

**Document:** docs/approvals/0138-phase9-slice1-storage-foundation-implementation-plan-hardened.md
**Status:** READY FOR IMPLEMENTATION — PENDING EXECUTION

## 1. Source Reconciliation
- **0136 / 0137 Match**: Provider is securely chosen as Vercel Blob. AWS S3 is discarded. The previous draft plan's ambiguity around Client vs Server upload is permanently resolved to Client Upload.
- **Unnecessary Elements Removed**: `NEXT_PUBLIC_VERCEL_URL` was proposed in the earlier draft but is not strictly required by standard Next.js Vercel Blob setups.

## 2. Provider
**VERCEL BLOB** is the canonical intended provider. AWS S3 and Supabase Storage are explicitly excluded as implementation dependencies.

## 3. Upload Architecture
The architecture will use **CLIENT-SIDE DIRECT UPLOAD** via Vercel Blob's `handleUpload` to bypass serverless memory and payload limits. 
The upload-token route MUST rigorously validate:
- NextAuth session presence.
- User role / privileges.
- Upload context/purpose.
- Allowed content-type and size.
- Environment boundary.

## 4. Upload Context
To prevent a generic "upload anything" vulnerability, uploads require an explicit intent context.
- `CUSTOM_REQUEST_ITEM_IMAGE` (MVP Required for Phase 7 unblock).
- `ORDER_DOCUMENT` (FUTURE / NOT IMPLEMENTED).
- `FINANCIAL_DOCUMENT` (FUTURE / NOT IMPLEMENTED).

## 5. Object Key
Canonical storage identities will NOT use filenames or PII. 
Object keys will be strictly server-generated using the pattern:
`{environmentNamespace}/{uploadContext}/{uuid}{sanitizedExtension}`
*(Example: `production/custom_request_item_image/a1b2c3d4-....jpg`)*

## 6. Storage Adapter
The domain must remain independent of Vercel Blob. 
The `IStorageAdapter` interface will support:
- `upload(file: Buffer | ReadableStream, filename: string, options: UploadOptions): Promise<string>` *(Server-side uploads if needed)*
- `getSignedUrl(storageKey: string): Promise<string>`
- `getMetadata(storageKey: string): Promise<BlobMetadata>`
- `delete(storageKey: string): Promise<void>`
- `exists(storageKey: string): Promise<boolean>`

## 7. Storage Identity
The database domain (in future slices) will persist a `storageKey`, NOT a raw Vercel Blob URL. The adapter translates `storageKey` → Vercel Blob URL internally.

## 8. Adapter Error Model
Errors must not leak vendor specifics. The adapter will throw standardized errors:
- `STORAGE_UPLOAD_FAILED`
- `STORAGE_NOT_FOUND`
- `STORAGE_DELETE_FAILED`
- `STORAGE_METADATA_FAILED`
- `STORAGE_SIGNING_FAILED`
- `STORAGE_INVALID_INPUT`

## 9. File Validation
Validation will occur at the server level when requesting the upload token:
- **MIME Allowlist**: `image/jpeg`, `image/png`, `image/webp`.
- **Extension Allowlist**: `.jpg`, `.jpeg`, `.png`, `.webp`.
- **Filename Sanitization**: Strip dangerous characters before appending to the UUID.
- **Malicious-file handling**: Future malware scanning deferred; currently relying on strict MIME checking. (Client MIME is untrusted; final validation occurs via magic-bytes if server-buffered, or Vercel Blob restricted content-types).

## 10. Size Limits
- **Application Limit**: Max **5MB** per image for Custom Requests (matching Phase 7 business logic).
- Must remain safely within Vercel's Blob limits.

## 11. Private Access
Default access is **PRIVATE**.
Access Flow: Authenticated Request → RootGrain RBAC Authorization → Adapter generates `getSignedUrl` (if Vercel Blob supports presigned URLs, or proxies through an authenticated route) → short-lived access.
*(Note: Vercel Blob currently uses unpredictable URLs for security. If strictly private ACLs are needed, they will be enforced via the upload configuration).*

## 12. RBAC
No new permissions are created in this slice. Existing `session.user` validation is sufficient for customers uploading their own Custom Request images. Admin bypasses are NOT added indiscriminately. 
*(Future document generation will require separate RBAC approval).*

## 13. Domain Database
NO domain models (e.g., `Document`, `Attachment`) will be introduced in this slice. Storage infrastructure and domain persistence remain strictly separate.

## 14. Callback
`onUploadCompleted` will be used ONLY for infrastructure-level confirmation logging. It will NOT create business records. Blob upload success ≠ business record creation success.

## 15. Failure Consistency
Pattern: `Blob upload → obtain storage reference → commit domain record`.
For this slice, because domain persistence is deferred, testing will verify that the upload process yields a safe `storageKey` successfully.

## 16. Orphan Cleanup
Manual cleanup initially. Cron/queue infrastructure is deferred.

## 17. Environment Separation
The architecture separates environments via key prefixing, as free-tier Vercel Blob often provisions a single store:
- `local/`
- `preview/`
- `production/`
This prevents accidental cross-environment storage writes.

## 18. Environment Variables
- `BLOB_READ_WRITE_TOKEN`
No AWS or Supabase credentials required.

## 19. Vercel Blob SDK
Planned installation: `@vercel/blob`.
Required APIs: `handleUpload`, `put`, `del`, `head`.

## 20. Free-Tier Governance
Free tier is the initial operating target. Capacity must be monitored. The application enforces its own file-size constraints.

## 21. Test Strategy (PLANNED TESTS)
- Adapter contract conformance.
- Invalid input handling.
- Rejected MIME types and oversized files.
- Unauthorized token request rejection.
- Valid context assignment and safe object key generation.

## 22. Manual UAT
1. Authenticated customer request for upload token.
2. Valid image upload.
3. Invalid type / Oversized file rejection.
4. Private object behavior verification.
5. Unauthorized request rejection.
6. Local environment isolation.

## 23. Security Testing
Explicit negative tests for: unauthenticated user, wrong context, malicious filename, oversized file, public URL bypass attempts.

## 24. Local Development
Safe local behavior is enforced by injecting the `local/` prefix into all generated storage keys, ensuring no production files are overwritten.

## 25. Implementation Boundary
**INCLUDED**: Vercel Blob SDK, StorageAdapter, `route.ts` token infrastructure, error abstraction, tests.
**EXCLUDED**: Document domain models, Invoice generation, CustomRequest persistence, cleanup worker.

## 26. File Plan
- `src/lib/infrastructure/storage/storage.types.ts`
- `src/lib/infrastructure/storage/storage-adapter.interface.ts`
- `src/lib/infrastructure/storage/vercel-blob.adapter.ts`
- `src/lib/infrastructure/storage/index.ts`
- `src/app/api/upload/route.ts`

## 27. API Route Design
`src/app/api/upload/route.ts`
- **Method**: POST
- **Auth**: `getServerSession` validation.
- **Context**: Requires `uploadContext` in payload.
- **Validation**: Enforces 5MB limit and MIME list based on context.
- **handleUpload**: Configures `onBeforeGenerateToken` to enforce the safe object key, and `onUploadCompleted` for logging.

## 28. NEXT_PUBLIC_VERCEL_URL Decision
**Removed**. Standard Next.js deployment automatically handles `request.url` inference in `handleUpload`.

## 29. Authentication Architecture
Standard NextAuth `getServerSession` (or `auth()`) is used inside the Route Handler.

## 30. Code Quality
Preserves TypeScript strictness, existing lint rules, and error-handling conventions.

## 31. Migration Policy
**Migration required = NO**. No database changes in this slice.

## 32. Final Implementation Sequence
1. Dependency (`@vercel/blob`).
2. Storage types.
3. Adapter contract.
4. Vercel Blob adapter.
5. Adapter factory.
6. Upload authorization logic.
7. Validation logic.
8. Upload route handler.
9. Automated tests.
10. Static validation.
11. Manual storage verification.

==============================================================
FINAL STATUS
IMPLEMENTATION PLAN HARDENED
READY FOR IMPLEMENTATION — PENDING EXECUTION
==============================================================
