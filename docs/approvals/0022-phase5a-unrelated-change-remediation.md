# 0022 Phase 5A: Unrelated Repository Change Remediation

**Status:** APPROVED

## 1. Background

During the final pre-deployment repository hygiene check for Phase 5A, multiple unrelated local modifications were detected in the repository working tree. Because Phase 5A requires strict isolation, any uncommitted dependency change or tooling modification must be analyzed and remediated before the Phase 5A deployment commit is created. This document outlines the findings and proposes a remediation strategy.

## 2. package.json finding

The `package.json` file contains an uncommitted modification adding `"pg": "^8.23.0"` to the dependencies. 
- `pg` is imported by several root-level JS diagnostic and migration scripts (e.g., `verify_strict.js`, `check_data.js`).
- `pg` is **not** imported by any core application code or by any of the new Phase 5A files. 
- The production architecture natively connects to PostgreSQL via `@prisma/client` and does not require the standalone `pg` package.

## 3. package-lock.json finding

The `package-lock.json` file contains uncommitted modifications reflecting the dependency sub-tree generated solely as a consequence of the local installation of `"pg": "^8.23.0"`.

## 4. supabase temp finding

The file `supabase/.temp/cli-latest` contains an uncommitted modification updating its version string (from `v2.101.0` to `v2.115.0`). This is a generated metadata file managed automatically by the local Supabase CLI to track the latest available version.

## 5. Historical provenance

- **pg & diagnostic scripts:** A forensic audit of the git history reveals that the scripts importing `pg` (`verify_strict.js`, etc.) are entirely **untracked** (`??` in git status). They were never committed to the repository. Thus, the `pg` dependency and these scripts were introduced locally during a previous forensic/diagnostic session (likely around Phase 4 or 5) and abandoned in the working tree.
- **supabase/.temp/cli-latest:** Git history shows this file was introduced and accidentally tracked in commit `6205913b44d11913375a863ea059dbe479d93bc7` ("Phase 4: bKash Integration & Supabase Logistics"). Because it is tracked, any subsequent local use of the Supabase CLI triggers an uncommitted modification to this file.

## 6. Phase 5A isolation requirement

The intended Phase 5A changeset is exactly:
- `src/app/actions/payment.admin.ts`
- `src/app/(storefront)/admin/orders/[id]/PaymentLedger.tsx`
- `src/app/(storefront)/admin/orders/[id]/page.tsx`
- `tests/payment.admin.test.ts`
- `src/app/(storefront)/admin/orders/OrdersTable.tsx`

To prevent deployment contamination, the Phase 5A commit MUST NOT include the `pg` dependency or the tooling metadata. 

## 7. Options

### For package.json / package-lock.json:
- **OPTION A (Ignore & Exclude):** Keep `pg` in the working tree but exclude it from the Phase 5A commit (e.g., by committing files individually). 
  - *Risk:* High. Future commits (e.g., `git commit -am "hotfix"`) might accidentally bundle it.
- **OPTION B (Remove):** Formally remove `pg` since the diagnostic scripts are untracked and the production app doesn't need it. 
  - *Risk:* Low. The application is completely insulated. Diagnostic scripts would need to be run with `npx` or temporary installs in the future.
- **OPTION C (Formalize):** Create a separate commit formally adding `pg` to the repo for forensic tools. 
  - *Risk:* Medium. It adds unnecessary weight to the production build artifact just to satisfy untracked local scripts.

### For supabase/.temp/cli-latest:
- **KEEP:** Continue tracking it and exclude it from this commit.
- **REMOVE FROM TRACKING:** Remove it from git cache and let it remain locally, adding `.temp/` to `.gitignore`.
- **LEAVE UNCOMMITTED:** Revert the local change but keep it tracked.

## 8. Recommended remediation

**For package.json / package-lock.json:**
**Recommend OPTION B.** 
We should execute a targeted removal of `pg` (`npm uninstall pg` or `git restore package.json package-lock.json`) to return the dependency tree to its exact state prior to the forensic interference. The untracked diagnostic `.js` files can remain in the working tree as historical artifacts without impacting the deployment.

**For supabase/.temp/cli-latest:**
**Recommend REMOVE FROM TRACKING.**
This file is generated tooling metadata and should never have been tracked. We should use `git rm --cached supabase/.temp/cli-latest` and ensure `supabase/.temp` is ignored, successfully decoupling it from all future Phase deployments.

## 9. Risk analysis

- **Technical impact:** Safely returns the production dependency tree to its authorized, governed state without removing the actual forensic scripts from the disk.
- **Deployment impact:** Eliminates the risk of the CI/CD pipeline downloading unused packages, keeping the artifact slim.
- **Historical impact:** Corrects a tracking mistake from Phase 4 by untracking the `.temp` folder.

## 10. Exact files affected

Remediation will target:
- `package.json` (revert)
- `package-lock.json` (revert)
- `supabase/.temp/cli-latest` (untrack)

Phase 5A files will remain staged/ready.

## 11. Human approval gate

Do not execute remediation until human approval is explicitly granted.

- [ ] APPROVED
- [ ] REJECTED
