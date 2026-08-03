import { IAuthorizationGuard, NextGuard } from "./types";
import { AuthorizationContext } from "../types/authorization-context";
import { AuthorizationDecision } from "../types/authorization-decision";
import { IPolicyResolver } from "../contracts/policy-resolver";

export class PolicyGuard implements IAuthorizationGuard {
  constructor(private policyResolver: IPolicyResolver) {}

  async execute(context: AuthorizationContext, next: NextGuard): Promise<AuthorizationDecision> {
    const policyDecision = await this.policyResolver.evaluate(context);
    
    if (policyDecision && !policyDecision.allowed) {
      return policyDecision; // Fail closed if soft block applies
    }

    return next();
  }
}
