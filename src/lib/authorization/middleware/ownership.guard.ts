import { IAuthorizationGuard, NextGuard } from "./types";
import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";
import { IOwnershipResolver } from "../contracts/ownership-resolver";

export class OwnershipGuard implements IAuthorizationGuard {
  constructor(private ownershipResolver: IOwnershipResolver) {}

  async execute(context: AuthorizationContext, next: NextGuard): Promise<AuthorizationDecision> {
    if (!context.ownerId && !context.guestTokenHash) {
      // Not an ownership-bound resource check
      return next();
    }

    const isOwner = await this.ownershipResolver.verifyOwnership(context);
    
    if (!isOwner) {
      return {
        allowed: false,
        effect: "OBFUSCATE",
        resource: context.resource,
        action: context.action,
        ownerVerified: false,
        auditRequired: true,
        reason: "OWNERSHIP_VERIFICATION_FAILED"
      };
    }

    const decision = await next();
    decision.ownerVerified = true;
    return decision;
  }
}
