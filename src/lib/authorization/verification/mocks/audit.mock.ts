import { IAuditService } from "../../middleware/contracts/audit-service";
import { AuthorizationContext } from "../../types/authorization-context";
import { AuthorizationDecision } from "../../types/authorization-decision";

export class MockAuditService implements IAuditService {
  public logs: { ctx: AuthorizationContext; decision: AuthorizationDecision }[] = [];

  async log(context: AuthorizationContext, decision: AuthorizationDecision): Promise<void> {
    this.logs.push({ ctx: context, decision });
  }

  clear(): void {
    this.logs = [];
  }
}
