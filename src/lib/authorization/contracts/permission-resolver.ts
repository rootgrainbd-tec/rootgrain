import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";

export interface IPermissionResolver {
  resolve(context: AuthorizationContext): Promise<AuthorizationDecision>;
}
