import { IPermissionResolver } from "../contracts/permission-resolver";
import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";

export interface IPermissionRepository {
  getUserPermissions(userId: string): Promise<{ permissionId: string; effect: "ALLOW" | "DENY" }[]>;
  getRolePermissions(roles: string[]): Promise<string[]>;
}

export class PermissionResolver implements IPermissionResolver {
  constructor(private permissionRepo: IPermissionRepository) {}

  async resolve(context: AuthorizationContext): Promise<AuthorizationDecision> {
    const requiredPermission = `${context.resource}:${context.action}`;

    const decision: AuthorizationDecision = {
      allowed: false,
      effect: "DENY",
      resource: context.resource,
      action: context.action,
      ownerVerified: false,
      auditRequired: true,
    };

    if (!context.userId) {
      if (context.permissions.includes(requiredPermission)) {
        decision.allowed = true;
        decision.effect = "ALLOW";
      }
      return decision;
    }

    const rolePerms = await this.permissionRepo.getRolePermissions(context.roles);
    const userPerms = await this.permissionRepo.getUserPermissions(context.userId);

    const allowedSet = new Set<string>(rolePerms);
    const deniedSet = new Set<string>();

    for (const up of userPerms) {
      if (up.effect === "DENY") {
        deniedSet.add(up.permissionId);
      } else if (up.effect === "ALLOW") {
        allowedSet.add(up.permissionId);
      }
    }

    if (deniedSet.has(requiredPermission) || deniedSet.has("*")) {
      decision.allowed = false;
      decision.effect = "DENY";
      decision.reason = "EXPLICIT_DENY";
      return decision;
    }

    if (allowedSet.has(requiredPermission) || allowedSet.has("*")) {
      decision.allowed = true;
      decision.effect = "ALLOW";
      return decision;
    }

    return decision;
  }
}
