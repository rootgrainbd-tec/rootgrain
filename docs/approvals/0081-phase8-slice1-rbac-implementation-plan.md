# 0081-PHASE8-SLICE1-RBAC-IMPLEMENTATION-PLAN

**Document:** docs/approvals/0081-phase8-slice1-rbac-implementation-plan.md
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

## 5. Permission Catalogue
Convention: `resource.action`
**Minimal Seed List:**
- `payment.record` (Existing Phase 5a action)
- `payment.void` (Future Slice 2)
- `advance.revise` (Future Slice 3)
- `price.revise` (Future Slice 4)
- `custom_request.manage` (Phase 7 support)
- `order.manage` (Phase 6 support)
- `review.manage`

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
*Note: Timestamps and active/disabled states are omitted to prevent schema bloat. If a permission is no longer needed, it will be removed via migration.*

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
*Note: Relies on the existing Prisma `Role` enum. Prevents duplicating roles.*

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
The resolution algorithm is an additive union:
`Effective Permissions = (Permissions mapped to User's Role) U (Permissions explicitly mapped to User's ID)`.
Explicit DENY is not supported. To revoke a permission, the base role must not grant it, and the user must not have a direct grant.

## 10. Admin Bridge Strategy
Slice 1 will build the backend foundation and seed the database.
**Slice 1 changes:** Introduce models, update the seed script, create the authorization helper. The existing `session.role === "ADMIN"` bridge in Phase 5a/6/7 code will NOT be touched.
**Future slices:** As Slices 2, 3, and 4 are built, they will natively use the new `requirePermission` helper. Later tech debt phases will retroactively replace the legacy bridges.

## 11. NextAuth Session Architecture
**Decision:** OPTION B (Role in Session + Server-Side Permission Resolution).
**Why:** Storing `permissions: string[]` in the NextAuth JWT creates significant token bloat and introduces stale permission risks (a revoked permission remains active until the 30-day token expires). Option B maintains a slim JWT and guarantees zero stale-permission risk by resolving permissions directly against the database on each request.

## 12. Permission Caching
Database lookups will be cached per-request using the React `cache()` function (e.g., `react.cache`). This ensures that if a Server Action or RSC component checks `requirePermission` 5 times in a single render/action lifecycle, only 1 Prisma query is executed. The cache is automatically destroyed at the end of the request, eliminating stale persistence.

## 13. Server-Side Authorization Helper
**Canonical API:** `requirePermission(permissionName: string)`
**Behavior:**
1. Validates authenticated session via `getServerSession()`.
2. Resolves permissions (DB + React Cache).
3. If not found, throws a formal `AppError("Forbidden: Missing required permission", 403)`.
4. Optionally supports a temporary Admin bypass mode if explicitly required during rollout.

## 14. Seeding Strategy
Update `prisma/seed-authorization.ts` to perform idempotent `upsert`s for the predefined Permission catalogue and the `RolePermission` mapping (assigning all permissions to the `ADMIN` role by default). This runs alongside `prisma/seed.ts` safely in CI/CD without creating duplicates.

## 15. Security Model
- **Client Spoofing:** Impossible. Permissions are strictly derived from canonical DB records on the server.
- **Stale Sessions:** Solved by Option B (Server-side resolution). Revoked permissions are enforced on the immediate next request.
- **Unauthorized Actions:** Handled by throwing strict `403` errors before any business logic executes.

## 16. Database Impact
| Model | Existing? | Required Change | Reason |
| --- | --- | --- | --- |
| `Permission` | NO | Create | Foundation of granular RBAC |
| `RolePermission` | NO | Create | Map roles to permissions |
| `UserPermission` | NO | Create | Allow user-specific overrides |

## 17. Migration / Rollout Strategy
- **Stage 1:** Define schema.
- **Stage 2:** Update `seed-authorization.ts`.
- **Stage 3:** Build `requirePermission` helper with React cache.
- **Stage 4:** Execute full test suite against Phase 6 and Phase 7 existing actions to prove the Admin bridge was not broken.
*(Do not migrate legacy actions yet).*

## 18. Test Matrix
- **AUTH:** 1. Unauth rejected. 2. USER rejected for admin permission. 3. ADMIN receives mapped permissions. 4. Role permission works. 5. User-specific permission works.
- **OVERRIDE:** 6. User grant works. 8. Precedence union verified.
- **SECURITY:** 9. Client cannot spoof permission. 11. Revoked permission immediately blocked.
- **SESSION:** 13. Hydration unaffected. 14. Resolution cache works (spy on DB calls).
- **BRIDGE:** 17. Existing ADMIN functionality (e.g. `recordPayment`) remains accessible via legacy bridge.
- **SEED:** 19. Idempotent seed doesn't throw. 20. Duplicate names prevented.
- **REGRESSION:** 21. Phase 7 Custom Requests unaffected. 24. Phase 5a Payment Recording unaffected.

## 19. Performance
Prisma RBAC queries (`findMany` with filtering on Role/User) generally cost `<5ms`. Cached via React `cache()`, the amortized cost per Next.js request is effectively `O(1)` query, completely eliminating N+1 database queries during complex operations.

## 20. Risks
- Database queries failing or creating latency bottlenecks if `cache()` is implemented incorrectly.
- Edge runtimes incompatible with Prisma relying on permissions (not currently applicable as RootGrain uses Node runtime Server Actions).

## 21. Acceptance Criteria
1. Schema contains the 3 new RBAC tables.
2. `seed-authorization.ts` correctly upserts the `payment.*`, `advance.*`, and `price.*` permissions.
3. `requirePermission` helper is implemented with React caching.
4. Legacy `session.role === "ADMIN"` bridges remain intact and functional.
5. All 70+ integration tests pass.
6. Absolutely no financial models or mutations are introduced.

## 22. Explicit Out-of-Scope
- Implementing UI for Permission Management.
- Modifying `PaymentService` or NextAuth logic.
- Building the Payment Voiding action.

## 23. Open Decisions
None. The architecture is definitively frozen to server-side DB resolution using the React request cache, and `ALLOW`-only overrides.

==============================================================
STATUS: READY FOR APPROVAL
==============================================================
