import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";

export type NextGuard = () => Promise<AuthorizationDecision>;

export interface IAuthorizationGuard {
  execute(context: AuthorizationContext, next: NextGuard): Promise<AuthorizationDecision>;
}
