# 0082-PHASE8-SLICE1-RBAC-IMPLEMENTATION-PLAN-R1

**Document:** docs/approvals/0082-phase8-slice1-rbac-implementation-plan-r1.md
**Status:** READY FOR APPROVAL

## 1. Objective
Build the mandatory authorization foundation required by all later Phase 8 financial mutations (Payment Voiding, Advance Revision, Price Revision). Replace the temporary coarse-grained `ADMIN` role check with a scalable, database-backed granular permission model without introducing token-size limitations.

## 2. Scope
- Introduce `Permission`, `RolePermission`, and `UserPermission` to `schema.prisma`.
- Implement idempotent seeding mechanism (`prisma/seed-authorization.ts`).
- Create `requirePermission` server-side authorization helper with React request caching.
- Preserve the existing `session.role === "ADMIN"` bridge during rollout.

## 3. Repository Audit
- **Schema:** Verified `Permission`, `RolePermission`, and `UserPermission` do NOT exist.
- **NextAuth:** `src/lib/auth.ts` hydrates `Role.USER` or `Role.ADMIN` into the JWT. It does NOT handle granular permissions.
- **Bridges:** Coarse `session.role === "ADMIN"` checks are hardcoded in `src/services/payment.service.ts` and `src/app/actions/custom-request.ts`.
- **Seeding:** `prisma/seed-authorization.ts` currently exists as a placeholder/stub: `"Seeding Authorization Foundation... (Skipped - models not in schema)"`.

## 4. Current Authorization Map
| File | Action | Current Authorization | Target Permission | Bridge Status |
| --- | --- | --- | --- | --- |
| `payment.admin.ts` | `recordAdminPaymentAction` | `session.user.role === "ADMIN"` | `payment.record` | Preserve for Slice 1 |
| `payment.service.ts` | `recordPayment` | `(session.user as any).role !== "ADMIN"` | `payment.record` | Preserve for Slice 1 |
| `custom-request.ts` | `beginCustomRequestReview` | `role !== "ADMIN"` | `custom_request.manage` | Preserve for Slice 1 |
| `custom-request.ts` | `finalizeCustomRequestQuote` | `role !== "ADMIN"` | `custom_request.manage` | Preserve for Slice 1 |
| `custom-request.ts` | `cancelCustomRequest` | `role !== "ADMIN"` | `custom_request.manage` | Preserve for Slice 1 |
| `custom-request.ts` | `createAdminOfflineCustomRequest` | `role !== Role.ADMIN` | `custom_request.manage` | Preserve for Slice 1 |
| `admin.ts` / `admin.mto.ts` | Order mutations | `role !== Role.ADMIN` | `order.manage` | Preserve for Slice 1 |

## 5. Permission Catalogue & Classification
Convention: `resource.action`

### A. LEGACY FUNCTIONALITY MIGRATION TARGET
These permissions map to existing features.
- `payment.record`: Seeded but not yet enforcement-active.
- `custom_request.manage`: Seeded but not yet enforcement-active.
- `order.manage`: Seeded but not yet enforcement-active.
- `review.manage`: Seeded but not yet enforcement-active.
*(Legacy functionality relies entirely on the coarse ADMIN bridge. Slice 1 seeds these permissions for future migration, but existing code will NOT enforce them yet).*

### B. FUTURE PHASE 8 PERMISSION
These permissions secure future financial mutations.
- `payment.void`: Seeded now; merely defined for future use (Slice 2).
- `advance.revise`: Seeded now; merely defined for future use (Slice 3).
- `price.revise`: Seeded now; merely defined for future use (Slice 4).

## 6. Permission Model
```prisma
model Permission {
  id          String           @id @default(cuid())
  name        String           @unique
  description String?
  roles       RolePermission[]
  users       UserPermission[]
}
```

## 7. RolePermission Model
```prisma
model RolePermission {
  id           String     @id @default(cuid())
  role         Role
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([role, permissionId])
}
```

## 8. UserPermission Model
```prisma
model UserPermission {
  id           String     @id @default(cuid())
  userId       String
  permissionId String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([userId, permissionId])
}
```
*Semantic:* Strictly **ALLOW**. User overrides represent additional explicit grants beyond their base role. Deny rules are unnecessary because default access is DENY.

## 9. Permission Resolution Precedence
`Effective Permissions = (Permissions mapped to User's Role) U (Permissions explicitly mapped to User's ID)`.

## 10. Admin Bridge Strategy
Slice 1 establishes the backend foundation. The existing `session.role === "ADMIN"` checks in Phase 5A/6/7 code will NOT be touched.
**Migration:** Legacy checks are preserved to guarantee Admins retain access while permissions are safely seeded and hydrated. Future slices or tech debt phases will retroactively replace these coarse checks with granular permissions.

## 11. Seeding Strategy
`prisma/seed-authorization.ts` will idempotently upsert the full Permission Catalogue. 
**Admin Role Seeding:** Every seeded permission (Phase 8 and Legacy) will be mapped to the `ADMIN` role. 
*Reasoning:* ADMINs must retain all current administrative capabilities during the RBAC migration. By assigning all permissions to ADMIN by default, we guarantee no loss of functionality once the bridges are swapped out.

## 12. NextAuth Session Architecture
**Decision:** OPTION B (Role in Session + Server-Side Permission Resolution).
Storing `permissions: string[]` in the NextAuth JWT introduces stale permission risks (a revoked permission remains active until the 30-day token expires). Option B maintains a slim JWT and guarantees zero stale-permission risk by resolving permissions directly against the database on each request.

## 13. Permission Caching
Database lookups will be cached per-request using the React `cache()` function. A single request/Server Action lifecycle querying `requirePermission` multiple times will hit Prisma exactly once. The cache is automatically destroyed at the end of the request, eliminating stale persistence.

## 14. Server-Side Authorization Helper
**Final API Contract:** `requirePermission(permissionName: string)`
**Security Semantics:**
1. Authenticate the session natively.
2. Resolve effective permissions from the DB (using React request cache).
3. Check the exact permission string provided.
4. Throw an immediate `AppError("Forbidden: Missing required permission", 403)` if missing.

*Strict Rules:*
- No client-provided permissions.
- No client-provided role overrides.
- No generic `allowAdmin`, `bypass`, or `skipPermission` flags.
- If legacy compatibility requires `session.role === "ADMIN"`, the bridge must live in the legacy code block itself, outside of `requirePermission`.

## 15. Security Rationale
- **Client Spoofing:** Impossible. Permissions are resolved exclusively server-side.
- **Stale Sessions:** Eliminated. Revoked permissions take effect instantly on the next request.
- **Bypass Risk:** The strict `requirePermission` API lacks an escape hatch, forcing all future endpoints to depend strictly on assigned DB permissions. 

## 16. Database Impact
| Model | Existing? | Required Change | Reason |
| --- | --- | --- | --- |
| `Permission` | NO | Create | Foundation of granular RBAC |
| `RolePermission` | NO | Create | Map roles to permissions |
| `UserPermission` | NO | Create | Allow user-specific overrides |

## 17. Migration / Rollout Strategy
- **Stage 1:** Define schema.
- **Stage 2:** Update `seed-authorization.ts` (Idempotent upsert + ADMIN mapping).
- **Stage 3:** Build `requirePermission` helper with React cache.
- **Stage 4:** Execute full test suite against Phase 6 and Phase 7 existing actions.

## 18. Test Matrix
- **AUTH:** 1. Unauth rejected. 2. USER rejected for admin permission. 3. ADMIN receives mapped permissions. 4. Role permission works. 5. User-specific permission works.
- **OVERRIDE:** 6. User grant works. 8. Precedence union verified.
- **SECURITY:** 9. Client cannot spoof permission. 11. Revoked permission immediately blocked.
- **SESSION:** 13. Hydration unaffected. 14. Resolution cache works.
- **BRIDGE:** 17. Existing ADMIN functionality remains accessible via legacy bridge.
- **SEED:** 19. Idempotent seed doesn't throw. 20. Duplicate names prevented.
- **REGRESSION:** 21. Phase 7 Custom Requests unaffected. 24. Phase 5A Payment Recording unaffected.

## 19. Performance
Prisma RBAC queries (`findMany` with filtering on Role/User) are highly performant (`<5ms`). Cached via React `cache()`, the amortized cost per Next.js request is effectively `O(1)` query, completely eliminating N+1 database queries.

## 20. Acceptance Criteria
- [ ] Permission catalogue classified appropriately (Foundation, Future, Legacy).
- [ ] ADMIN mappings seeded idempotently for all permissions.
- [ ] Legacy `session.role === "ADMIN"` bridges remain completely unchanged.
- [ ] `requirePermission` API possesses NO generic bypass flag.
- [ ] Permission resolution is strictly server-side (Option B).
- [ ] React cache is strictly request-scoped.
- [ ] `UserPermission` semantic is explicitly ALLOW-only.
- [ ] Phase 7 regression test suite remains fully green.
- [ ] No financial mutation logic or fields are introduced.

==============================================================
STATUS: READY FOR APPROVAL
==============================================================
