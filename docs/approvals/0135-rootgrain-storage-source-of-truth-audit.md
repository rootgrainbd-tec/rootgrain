# 0135-ROOTGRAIN-STORAGE-SOURCE-OF-TRUTH-AUDIT

**Document:** docs/approvals/0135-rootgrain-storage-source-of-truth-audit.md
**Status:** COMPLETE / READ-ONLY AUDIT

## 1. Objective
Determine the ACTUAL intended storage architecture/provider for RootGrain using ONLY authoritative project documents and existing repository implementation evidence. This corrects a previous reconnaissance error that assumed AWS S3 was an active infrastructure.

## 2. Authoritative Source Hierarchy
Evidence is classified as follows:
- **LEVEL 1:** Approved architecture/ADR
- **LEVEL 2:** Approved implementation plan
- **LEVEL 3:** Implemented code
- **LEVEL 4:** Deferred roadmap item
- **LEVEL 5:** Informal mention

## 3. AWS S3 Origin Analysis
- **Origin:** First mentioned in `0004-phase2-master-audit-and-implementation-plan.md` (Level 1/2) as an open question: *"Which storage bucket will be used for Custom Request images? (Supabase Storage, AWS S3, or Vercel Blob)."*
- **Subsequent Mentions:** Mentioned in `0005R1` (Level 1) as "Dedicated Document Storage (AWS S3)". Later in Phase 7 (`0052`, `0054`) as an option ("e.g., Vercel Blob or AWS S3"). 
- **Status:** AWS S3 was **never approved** as a final selection. It was consistently framed as a candidate or "example" bucket provider. It remains a deferred/unresolved option.

## 4. Vercel Blob Origin Analysis
- **Origin:** Same early Phase 2 open question as AWS S3 (`0004`).
- **Phase 7 Recommendation:** `0055-phase7-custom-order-request-system-business-specification-r2.md` explicitly recommends Vercel Blob: *"Recommendation: Vercel Blob. Evidence: No existing upload providers (S3/Cloudinary) exist in package.json. Vercel Blob is the native, zero-config object storage for the Next.js/Vercel ecosystem."*
- **Status:** Recommended (Level 2 candidate), but document `0055` ended with `STATUS: AWAITING APPROVAL`. The implementation was formally deferred.

## 5. Supabase Storage Origin Analysis
- **Origin:** Mentioned alongside S3/Blob in the initial Phase 2 audit (`0004`).
- **Status:** Not mentioned again as a serious candidate in subsequent Phase 6/7 documents. It was an alternative option that was dropped from the final Phase 7 recommendations. 

## 6. Phase 7 Evidence
In Phase 7 (`0051`, `0052`, `0053`, `0054`), the requirement was stated as: *"Phase 7 will require provisioning a Vercel Blob, AWS S3, or similar bucket for secure, size-limited image storage... (Implementation deferred)."*
- **Wording Intent:** This was an **unresolved provider choice** (Option B) and explicitly marked as a **deferred infrastructure task** (Option D). No provider was formally implemented.

## 7. Phase 9 Evidence
Based on `0133` and `0134`, Phase 9 (Documents & Communication) intrinsically requires:
- A secure file storage foundation.
- A provider decision.
Phase 9 does not strictly mandate *which* provider is used, only that a robust, secure storage solution exists to preserve immutable documents (DOC-001).

## 8. Existing Code Evidence
A comprehensive scan of `src/`, `prisma/`, `scripts/`, and `scratch/` reveals:
- `Vercel Blob APIs`: ZERO matches.
- `AWS SDK / S3Client / PutObject`: ZERO matches.
- `Supabase Storage APIs`: ZERO matches.
- **Result:** No actual provider integration exists in the codebase.

## 9. Environment Evidence
A scan of `.env` and `.env.example` reveals:
- `BLOB_*`: NOT FOUND
- `AWS_*`: NOT FOUND
- `S3_*`: NOT FOUND
- `SUPABASE_*_KEY` (Storage specific): NOT FOUND
- **Result:** No storage provider credentials are configured.

## 10. Dependency Evidence
A scan of `package.json` confirms:
- `@vercel/blob`: NOT INSTALLED
- `@aws-sdk/*`: NOT INSTALLED
- `@supabase/supabase-js`: NOT INSTALLED (RootGrain relies on Prisma, not the Supabase JS client).
- **Result:** No storage SDKs are present.

## 11. Current Storage Status
- **AWS S3**: Implemented? NO. Approved? NO. Deferred? YES. Account exists? NO EVIDENCE. Code integration? NO.
- **Vercel Blob**: Implemented? NO. Approved? NO (Recommended but awaiting approval in `0055`). Deferred? YES. Account exists? NO EVIDENCE. Code integration? NO.
- **Supabase Storage**: Implemented? NO. Approved? NO. Deferred? YES. Account exists? NO EVIDENCE. Code integration? NO.

## 12. Provider Decision Status
- **What has already been decided?** The architectural necessity of a secure, dedicated storage bucket for Custom Request attachments and Immutable Documents (Phase 7 / Phase 9).
- **What has not been decided?** The actual provider (AWS S3 vs Vercel Blob).
- **What requires explicit approval?** Formal selection of the storage provider and authorization to provision it.

## 13. Corrected Conclusion
Because AWS S3 is NOT part of the current RootGrain infrastructure, it is explicitly classified as: **NOT AN ACTIVE ROOTGRAIN INFRASTRUCTURE**. 

**NO PROVIDER APPROVED — PROVIDER DECISION REQUIRED**

## 14. Phase 9 Impact
- **Can Storage Foundation begin?** No.
- **Is provider selection required first?** Yes. A formal ADR (Architectural Decision Record) must be approved to lock in a provider.
- **Is an abstraction layer required?** Recommended, to decouple the application from the underlying vendor API.
- **Are additional architectural decisions needed?** Yes (bucket naming, access control mechanics, local development strategy).

## 15. Unresolved Decisions
- Formal provider selection (Vercel Blob vs AWS S3).
- Securing uploads (Presigned URLs vs Server-side buffering).
- Cleanup strategies for orphaned objects.
- Environment configuration strategy for local vs. production buckets.

## 16. Recommended Next Architectural Action
Draft a lightweight **Storage Architecture ADR** that explicitly compares Vercel Blob and AWS S3 strictly for RootGrain's constraints, recommends one, and requests canonical approval. 

==============================================================
FINAL STATUS: NO STORAGE PROVIDER APPROVED — ARCHITECTURAL DECISION REQUIRED
==============================================================
