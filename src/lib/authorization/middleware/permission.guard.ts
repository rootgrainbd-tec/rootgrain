import { IAuthorizationGuard, NextGuard } from "./types";
import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";
import { IPermissionResolver } from "../contracts/permission-resolver";

export class PermissionGuard implements IAuthorizationGuard {
  constructor(private permissionResolver: IPermissionResolver) {}

  async execute(context: AuthorizationContext, next: NextGuard): Promise<AuthorizationDecision> {
    const decision = await this.permissionResolver.resolve(context);

    if (decision.effect === "DENY" && decision.reason === "EXPLICIT_DENY") {
      return decision; // Stop pipeline on explicit deny
    }

    if (context.principal === "SUPER_ADMIN") {
      return next(); // Bypass permissions if SUPER_ADMIN
    }

    if (!decision.allowed) {
      return decision; // Stop pipeline on missing permissions
    }

    return next();
  }
}
