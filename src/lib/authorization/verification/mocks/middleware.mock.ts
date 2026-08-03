import { IAuthorizationGuard, NextGuard } from "../../middleware/types";
import { AuthorizationContext } from "../../types/authorization-context";
import { AuthorizationDecision } from "../../types/authorization-decision";

export class MockMiddlewareGuard implements IAuthorizationGuard {
  constructor(private decision: AuthorizationDecision | null) {}

  async execute(
    context: AuthorizationContext,
    next: NextGuard
  ): Promise<AuthorizationDecision> {
    if (this.decision) {
      return this.decision;
    }
    return next();
  }
}
