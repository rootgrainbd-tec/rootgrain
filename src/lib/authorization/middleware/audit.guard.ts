import { IAuthorizationGuard, NextGuard } from "./types";
import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";
import { IAuditService } from "../contracts/audit-service";

export class AuditGuard implements IAuthorizationGuard {
  constructor(private auditService: IAuditService) {}

  async execute(context: AuthorizationContext, next: NextGuard): Promise<AuthorizationDecision> {
    // Pipeline success: Explicit AuthorizationDecision generation.
    const decision: AuthorizationDecision = {
      allowed: true,
      effect: "ALLOW",
      resource: context.resource,
      action: context.action,
      ownerVerified: !!(context.ownerId || context.guestTokenHash),
      auditRequired: true,
      reason: "EXPLICIT_ALLOW"
    };

    await this.auditService.log(context, decision);
    
    // Terminate pipeline here, returning the explicit ALLOW decision up the chain.
    return decision;
  }
}
