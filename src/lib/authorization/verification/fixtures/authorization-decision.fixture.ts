import { AuthorizationDecision } from "../../types/authorization-decision";

export class AuthorizationDecisionFixture {
  static readonly explicitAllow: AuthorizationDecision = {
    allowed: true,
    reason: "EXPLICIT_ALLOW",
  };

  static readonly denyByDefault: AuthorizationDecision = {
    allowed: false,
    reason: "PIPELINE_EXHAUSTED_DEFAULT_DENY",
  };

  static create(allowed: boolean, reason: string): AuthorizationDecision {
    return { allowed, reason };
  }
}
