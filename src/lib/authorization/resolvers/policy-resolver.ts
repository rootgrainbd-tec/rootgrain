import { IPolicyResolver } from "../contracts/policy-resolver";
import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";

export interface IPolicyRepository {
  isSystemInLockdown(): Promise<boolean>;
  isSystemInMaintenance(): Promise<boolean>;
  isUserDeleted(userId: string): Promise<boolean>;
  isUserLocked(userId: string): Promise<boolean>;
}

export class PolicyResolver implements IPolicyResolver {
  constructor(private policyRepo: IPolicyRepository) {}

  async evaluate(context: AuthorizationContext): Promise<AuthorizationDecision | null> {
    const isLockdown = await this.policyRepo.isSystemInLockdown();
    if (isLockdown && context.principal !== "SUPER_ADMIN") {
      return {
        allowed: false,
        effect: "DENY",
        reason: "SYSTEM_LOCKDOWN",
        resource: context.resource,
        action: context.action,
        ownerVerified: false,
        auditRequired: true,
      };
    }

    const isMaintenance = await this.policyRepo.isSystemInMaintenance();
    if (isMaintenance && context.principal !== "SUPER_ADMIN" && context.principal !== "ADMIN") {
      return {
        allowed: false,
        effect: "DENY",
        reason: "MAINTENANCE_MODE",
        resource: context.resource,
        action: context.action,
        ownerVerified: false,
        auditRequired: true,
      };
    }

    if (context.userId) {
      const isDeleted = await this.policyRepo.isUserDeleted(context.userId);
      if (isDeleted) {
        return {
          allowed: false,
          effect: "DENY",
          reason: "ACCOUNT_DELETED",
          resource: context.resource,
          action: context.action,
          ownerVerified: false,
          auditRequired: true,
        };
      }

      const isLocked = await this.policyRepo.isUserLocked(context.userId);
      if (isLocked) {
        return {
          allowed: false,
          effect: "DENY",
          reason: "ACCOUNT_LOCKED",
          resource: context.resource,
          action: context.action,
          ownerVerified: false,
          auditRequired: true,
        };
      }
    }

    return null;
  }
}
