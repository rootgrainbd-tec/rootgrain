import { IAuthorizationService } from "../contracts/authorization-service";
import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";
import { IPermissionResolver } from "../contracts/permission-resolver";
import { IOwnershipResolver } from "../contracts/ownership-resolver";
import { IPolicyResolver } from "../contracts/policy-resolver";
import { IAuditService } from "../contracts/audit-service";

export class AuthorizationService implements IAuthorizationService {
  constructor(
    private permissionResolver: IPermissionResolver,
    private ownershipResolver: IOwnershipResolver,
    private policyResolver: IPolicyResolver,
    private auditService: IAuditService
  ) {}

  async authorize(context: AuthorizationContext): Promise<AuthorizationDecision> {
    let decision: AuthorizationDecision = {
      allowed: false,
      effect: "DENY",
      resource: context.resource,
      action: context.action,
      ownerVerified: false,
      auditRequired: true,
    };

    try {
      const policyDecision = await this.policyResolver.evaluate(context);
      if (policyDecision && !policyDecision.allowed) {
        decision = policyDecision;
        return decision;
      }

      const permDecision = await this.permissionResolver.resolve(context);

      if (permDecision.effect === "DENY" && permDecision.reason === "EXPLICIT_DENY") {
        decision = permDecision;
        return decision;
      }

      if (context.principal === "SUPER_ADMIN") {
        decision.allowed = true;
        decision.effect = "ALLOW";
        decision.reason = "SUPER_ADMIN_BYPASS";
        return decision;
      }

      if (!permDecision.allowed) {
        decision = permDecision;
        return decision;
      }

      if (context.ownerId || context.guestTokenHash) {
        const isOwner = await this.ownershipResolver.verifyOwnership(context);
        decision.ownerVerified = isOwner;

        if (!isOwner) {
          decision.allowed = false;
          decision.effect = "OBFUSCATE";
          decision.reason = "OWNERSHIP_VERIFICATION_FAILED";
          return decision;
        }
      }

      decision.allowed = true;
      decision.effect = "ALLOW";
      return decision;
      
    } finally {
      await this.auditService.log(context, decision);
    }
  }
}
