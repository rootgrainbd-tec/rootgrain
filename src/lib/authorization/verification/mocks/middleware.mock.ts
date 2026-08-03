import { IGuard } from "../../middleware/contracts/guard";
import { AuthorizationContext } from "../../types/authorization-context";
import { AuthorizationDecision } from "../../types/authorization-decision";

export class MockMiddlewareGuard implements IGuard {
  constructor(private decision: AuthorizationDecision | null) {}

  async execute(
    context: AuthorizationContext,
    next: (ctx: AuthorizationContext) => Promise<AuthorizationDecision>
  ): Promise<AuthorizationDecision> {
    if (this.decision) {
      return this.decision;
    }
    return next(context);
  }
}
