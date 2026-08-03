# Deployment Orchestration

This layer introduces strict boundaries for how artifacts move between environments.

**Crucial Rules:**
1. Environments are strictly linear: `LOCAL -> DEVELOPMENT -> STAGING -> PRODUCTION`. No skipping is allowed.
2. Every environment defines explicit policies governing promotion and approval.
3. Every rollout must logically pass through Health, Release, and Approval gates before being considered `ACTIVE`.
4. This layer knows nothing about *how* a rollout is physically orchestrated (e.g. Kubernetes RollingUpdate vs Recreate), it only models the logical lifecycle state and enforces the governance bounds.
