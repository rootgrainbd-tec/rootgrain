# ROOTGRAIN — PHASE 9 
# VERCEL BLOB PRIVATE STORE ARCHITECTURE AMENDMENT

**ID**: 0141
**Status**: PROPOSED — PENDING APPROVAL
**Replaces**: Portions of 0136 (Storage Foundation Architecture)
**Date**: 2026-08-27

## 1. Original Architecture
The original architecture (ADR 0136) mandated Vercel Blob as the primary blob storage provider. It assumed that Vercel Blob standard stores operate purely on an `access: 'public'` model where security relies on cryptographically unguessable URLs (`.public.blob.vercel-storage.com`), with `handleUpload` enforcing authentication at the time of upload.

## 2. Verified Runtime Finding
During the manual provider verification of Phase 9 Slice 1 (Report 0140), it was discovered that the RootGrain operator has securely provisioned the Vercel Blob store as a **Private Store**. 

Vercel Blob strictly enforces this provider-level constraint, rejecting any `upload()` or `put()` operations that attempt to set `access: 'public'`.

## 3. Private Store Behavior
- **Upload**: Operations must explicitly declare `access: 'private'`. 
- **Object Access**: URLs generated are formatted as `https://[store].private.blob.vercel-storage.com/...`.
- **Security**: Direct unauthenticated HTTP `GET` requests to these private URLs result in a `403 Forbidden` response. The Vercel Blob edge drops requests that do not possess a valid Vercel edge authorization or a valid SDK-issued signed delegation token.

## 4. Incompatibility
The current RootGrain `VercelBlobAdapter` and `handleUpload` integration hardcodes `access: 'public'` and assumes URLs can be served directly from the database to clients. This renders the current implementation incapable of uploading files to the active private store or serving them securely.

## 5. Amended Architecture
The architecture is amended to fully embrace the Private Store capability. This provides a significantly stronger security posture than unguessable public URLs, perfectly aligning with RootGrain's strict financial and PII data requirements.

### Security Model
1. **Private Storage**: All objects are stored as `access: 'private'`.
2. **Application Authorization**: RootGrain retains total authority over authorization. Vercel Blob is just a dumb storage layer.
3. **Authorized Temporary Access Mechanism**: RootGrain issues temporary, short-lived, presigned URLs to authorized clients, granting them time-bounded access to specific objects.

### Exact SDK/API Verification
Verification of the installed `@vercel/blob` SDK reveals explicit support for this flow:
- **Private Upload**: `@vercel/blob/client`'s `upload()` accepts `access: 'private'`. `handleUpload` routes the configuration seamlessly.
- **Private Access**: The SDK exports `issueSignedToken` and `presignUrl`. RootGrain can use these to generate a temporary `DelegationToken` scoped strictly to `operation: 'get'` and a specific `pathname`, valid for a short window (e.g., 5-15 minutes).

### Storage Identity
The domain identity remains the `storageKey` (e.g., `{environment}/custom_request_item_image/{uuid}.jpg`). 
Public URLs, Private Vercel URLs, or Presigned URLs MUST NOT be stored in the database. The system dynamically generates access URLs at runtime using the `storageKey`.

### Authorization Boundary
Private storage does NOT replace RootGrain's RBAC. The application must:
1. Identify the authenticated user.
2. Verify their role (e.g., ADMIN or resource owner).
3. Evaluate resource ownership/access before delegating access to the `StorageAdapter` to issue a presigned URL.

## 6. Implementation Impact
The `StorageAdapter` interface conceptually remains the same, but implementation details shift:
- `upload()`: Client integration must specify `access: 'private'`.
- `getSignedUrl()`: Must be implemented using `issueSignedToken` and `presignUrl` to return a time-bounded Vercel Blob URL.

## 7. Testing Requirements
The implementation plan MUST explicitly require verification of:
A. **Direct private URL without authorization**: Expected `403 Forbidden`.
B. **Authorized temporary/private access**: Expected `200 OK` when accessing via a freshly signed URL.
C. **Expired temporary access**: Expected rejection when accessing a signed URL past its `validUntil` timestamp.

## 8. Migration Impact
None. The system is in Phase 9 Slice 1 and no production data has been uploaded to the new blob store. No database schema changes are required.

## 9. Approval Required
This amendment requires explicit operator approval before code implementation begins.
