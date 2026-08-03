import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";

export interface IPolicyResolver {
  evaluate(context: AuthorizationContext): Promise<AuthorizationDecision | null>;
}
