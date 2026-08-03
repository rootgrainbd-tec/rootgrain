import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";

export interface IAuthorizationService {
  authorize(context: AuthorizationContext): Promise<AuthorizationDecision>;
}
