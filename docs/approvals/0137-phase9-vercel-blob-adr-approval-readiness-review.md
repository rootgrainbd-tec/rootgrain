# 0137-PHASE9-VERCEL-BLOB-ADR-APPROVAL-READINESS-REVIEW

**Document:** docs/approvals/0137-phase9-vercel-blob-adr-approval-readiness-review.md
**Status:** COMPLETE / READ-ONLY REVIEW

## 1. ADR Consistency
Review of `0135` against `0136` confirms:
- **AWS S3**: Correctly classified as historical/deferred only.
- **Supabase Storage**: Correctly classified as not selected.
- **Vercel Blob**: Accurately represented as the recommended provider.
- **Current Integration**: Accurately stated as non-existent.
No contradictions found. `0136` accurately reflects the source-of-truth from `0135`.

## 2. Official Free-Tier Verification
Standard Vercel Blob Hobby (Free) Tier limits (based on standard public pricing):
- **Storage Allowance**: 250 MB
- **Bandwidth/Transfer**: 1 GB / month
- **Max File Size**: 50 MB (Max for client-side, 4.5MB for serverless functions, must verify exact limit based on upload pattern).
- **Read Operations**: 1,000,000 / month
- **Write Operations**: 10,000 / month
- **Plan Dependency**: Yes, tied to the Hobby tier.

*Note*: Because account-specific limits or sudden Vercel pricing changes can occur:
**REQUIRES OFFICIAL ACCOUNT/BILLING VERIFICATION**

## 3. Free-Tier Architectural Impact
- **CustomRequestItem Images**: With a 5MB UI limit per image, 250MB total storage allows only ~50 maximum-size images. This is a severe bottleneck if Custom Requests scale rapidly.
- **Invoice / Payment Receipt PDFs**: Standard text-heavy PDFs average ~100KB–250KB. 250MB allows for 1,000 to 2,500 PDFs. This is sufficient for MVP/initial operation.
- **Bandwidth**: 1GB/month transfer will exhaust quickly if customers repeatedly download high-res 5MB images. PDFs are low-impact.
*Conclusion*: The free tier is viable for Phase 9 financial documents, but highly constrained for Phase 7 image uploads. The architecture *must* enforce strict file compression and size limits before upload.

## 4. Orphan Cleanup Recommendation
**Recommendation: B. Manual cleanup initially (with clear admin tooling).**
*Rationale*: RootGrain currently lacks a dedicated background worker architecture (no external cron or queue system is actively managing jobs). Attempting to build robust distributed scheduled cleanup is over-engineering for the MVP. For immediate unblocking, manual sweep capabilities in the Admin UI or via a secure admin API endpoint are sufficient.

## 5. Security Review
ADR `0136` successfully addresses:
- Private storage
- Signed access
- RBAC gate
- Object-key PII avoidance
- MIME validation
- Magic-byte validation
- Size limits
- Malicious uploads
- Environment separation
*No concrete omissions identified.*

## 6. Financial Document Review
ADR `0136` successfully addresses:
- Invoices & payment receipts (MVP Required)
- Future financial documents
- Immutability & version identity
- Checksum logging
- Audit trail (`OrderEvent`)
- Replacement prevention
*No concrete omissions identified.*

## 7. Failure Consistency Review
ADR `0136` handles DB/Blob failure states.
The recommended sequence:
`upload Blob → obtain reference → commit DB`
is the correct and safest pattern. If the DB fails, the blob is simply orphaned (which is harmless and can be cleaned up later). Reversing this (commit DB → upload) would leave the DB pointing to a non-existent file if the upload fails, breaking the UI and data integrity.

## 8. Abstraction Review
ADR `0136` requires a `StorageAdapter` interface (`upload`, `download`, `getSignedUrl`, `delete`, `exists`).
This correctly decouples the Vercel Blob SDK from the `Order`, `OrderItem`, `CustomRequest`, and `Document` domains. Future migration to AWS S3 would only require a new `S3StorageAdapter` implementing the exact same interface.

## 9. Environment Review
ADR `0136` explicitly mandates `NODE_ENV` / bucket namespacing to prevent local writes to the production bucket, and vice versa. It safely prevents environment leakage.

## 10. Phase 7 / Phase 9 Impact
Approval of ADR `0136` conclusively unblocks:
- **Phase 7**: Secure, compliant image storage for `CustomRequestItem`.
- **Phase 9**: The Storage Foundation prerequisite, directly enabling Document Generation (Invoices), Documents schema, and Communication.

## 11. Open Questions Classification
1. **COST / FREE-TIER VERIFICATION**: MUST RESOLVE BEFORE IMPLEMENTATION (To ensure 250MB limit doesn't break production in week 1).
2. **Orphan Cleanup Strategy**: CAN BE DECIDED DURING IMPLEMENTATION (Manual cleanup script can be written alongside the upload logic).

## 12. Approval Readiness
**A. READY FOR CANONICAL APPROVAL**

*Exact approval statement required:*
"I approve ADR 0136. RootGrain will use Vercel Blob as the object storage provider via the StorageAdapter pattern. Proceed with the Phase 9 Storage Foundation implementation slice."

==============================================================
FINAL STATUS: READY FOR CANONICAL APPROVAL
==============================================================
