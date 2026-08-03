import { IAuthorizationGuard, NextGuard } from "./types";
import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";

export class GuardComposer {
  private guards: IAuthorizationGuard[] = [];

  use(guard: IAuthorizationGuard): this {
    this.guards.push(guard);
    return this;
  }

  async execute(context: AuthorizationContext): Promise<AuthorizationDecision> {
    const dispatch = async (index: number): Promise<AuthorizationDecision> => {
      if (index >= this.guards.length) {
        // PIPELINE TERMINATION: Deny by default, fail closed.
        // Removed unconditional ALLOW state. 
        return {
          allowed: false,
          effect: "DENY",
          resource: context.resource,
          action: context.action,
          ownerVerified: false,
          auditRequired: true,
          reason: "PIPELINE_EXHAUSTED_DEFAULT_DENY"
        };
      }
      const guard = this.guards[index];
      return guard.execute(context, async () => dispatch(index + 1));
    };

    try {
      return await dispatch(0);
    } catch (e) {
      return {
        allowed: false,
        effect: "DENY",
        resource: context.resource,
        action: context.action,
        ownerVerified: false,
        auditRequired: true,
        reason: "PIPELINE_EXCEPTION"
      };
    }
  }
}
