# ROOTGRAIN — PHASE 9 SLICE 1
# STORAGE FOUNDATION PRIVATE STORE IMPLEMENTATION PLAN

**ID**: 0142
**Status**: PROPOSED — PENDING APPROVAL
**Target**: `src/lib/infrastructure/storage/vercel-blob.adapter.ts`, `src/app/api/upload/route.ts`

## Objective
Amend the existing Storage Foundation implementation to conform to Architecture Amendment 0141, ensuring seamless operation with the Vercel Blob Private Store and enforcing short-lived signed access tokens.

## Expected Mutations
- Source code mutations: Modifying existing adapter and upload route.
- Database mutation: 0
- Schema mutation: 0
- Blob store configuration mutation: 0

## 1. Adapter Changes (`vercel-blob.adapter.ts`)
The `VercelBlobAdapter` must be updated to leverage the `@vercel/blob` SDK's signing utilities for private access, while retaining its current interface.

**Modifications**:
1. Implement `getSignedUrl(storageKey: string, expiresInSeconds: number = 300)`:
   - Import `issueSignedToken` and `presignUrl` from `@vercel/blob`.
   - Call `issueSignedToken` to generate a `DelegationToken` scoped explicitly to:
     - `validUntil`: `Date.now() + expiresInSeconds * 1000`
     - `pathname`: `storageKey`
     - `operations`: `['get']`
   - Pass the returned token to `presignUrl({ ...token }, { operation: 'get', access: 'private' })`.
   - Return the resulting `presignedUrl`.
2. Update `delete(storageKey)`:
   - No change required, as the server uses `BLOB_READ_WRITE_TOKEN` which inherently bypasses private access constraints for control-plane operations.
3. Update `exists(storageKey)`:
   - No change required, `head()` operates correctly with the server token.

## 2. Upload Route Changes (`route.ts`)
The `handleUpload` flow does not inherently dictate the access level in its server configuration. The `access: 'private'` constraint is dictated by the client when it invokes `upload()`. However, we must ensure our route does not conflict with this.

**Modifications**:
- The current implementation of `route.ts` does not explicitly set `access: 'public'`. It validates session and context. 
- Ensure `allowedContentTypes` strictly enforces JPEG, PNG, and WebP for the `CUSTOM_REQUEST_ITEM_IMAGE` context.
- Ensure `maximumSizeInBytes` strictly enforces 5MB (5242880 bytes).
- No major changes required for `route.ts` itself, as the SDK handles delegation.

*Note: The actual `access: 'private'` flag is passed during the client-side `upload()` call, which will be implemented in Slice 2 when integrating the UI.*

## 3. Diagnostic Test Implementation
To satisfy the strict testing requirements dictated by the amendment, a temporary server-side diagnostic script or route MUST be utilized to verify the end-to-end behavior without requiring the UI implementation in Slice 1.

**Verification Steps**:
1. **Upload Execution**: A test script will execute a server-side `put()` with `access: 'private'` to place a dummy file into the store, representing a client upload.
2. **Test A (Direct Private URL)**: Attempt a raw HTTP GET to the resulting blob URL.
   - **Expected**: `403 Forbidden`.
3. **Test B (Authorized Temporary Access)**: 
   - Call `VercelBlobAdapter.getSignedUrl(key, 60)`.
   - Attempt a raw HTTP GET to the returned presigned URL.
   - **Expected**: `200 OK` and file contents are returned.
4. **Test C (Expired Temporary Access)**:
   - Call `VercelBlobAdapter.getSignedUrl(key, 1)`.
   - Wait 2 seconds.
   - Attempt a raw HTTP GET to the expired URL.
   - **Expected**: `403 Forbidden` (Token Expired).
5. **Cleanup**: 
   - Call `VercelBlobAdapter.delete(key)`.

## 4. Environment Requirements
- The existing `.env.local` containing `BLOB_READ_WRITE_TOKEN` is sufficient.
- The Vercel Blob store MUST remain configured as a Private Store.

## 5. Security Gates
- `access: 'public'` is strictly prohibited in code.
- Signed URLs must never exceed a 1-hour validity window (default 5 minutes).
- The `BLOB_READ_WRITE_TOKEN` remains strictly server-side.

## Approval
Awaiting user authorization to proceed with modifying `vercel-blob.adapter.ts` and executing the private access verification tests.
