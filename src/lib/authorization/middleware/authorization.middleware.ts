import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";
import { GuardComposer } from "./guard-composer";
import { CacheGuard } from "./cache.guard";
import { PolicyGuard } from "./policy.guard";
import { PermissionGuard } from "./permission.guard";
import { OwnershipGuard } from "./ownership.guard";
import { AuditGuard } from "./audit.guard";

export class AuthorizationMiddleware {
  private composer: GuardComposer;

  constructor(
    private cacheGuard: CacheGuard,
    private policyGuard: PolicyGuard,
    private permissionGuard: PermissionGuard,
    private ownershipGuard: OwnershipGuard,
    private auditGuard: AuditGuard
  ) {
    this.composer = new GuardComposer();
    
    // EXACT IMPLEMENTATION ORDER (from spec):
    // Cache lookup -> Permission guard -> Ownership guard -> Policy guard -> Audit guard
    // Outer wrapping removed. Pipeline evaluates strictly top-down.
    this.composer
      .use(this.cacheGuard)
      .use(this.permissionGuard)
      .use(this.ownershipGuard)
      .use(this.policyGuard)
      .use(this.auditGuard);
  }

  async handle(context: AuthorizationContext): Promise<AuthorizationDecision> {
    return this.composer.execute(context);
  }
}
