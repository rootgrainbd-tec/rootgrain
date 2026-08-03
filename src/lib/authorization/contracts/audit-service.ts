import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";

export interface IAuditService {
  log(context: AuthorizationContext, decision: AuthorizationDecision): Promise<void>;
}
