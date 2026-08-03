import { AuthorizationDecision } from "../../types/authorization-decision";

export class AuthorizationDecisionFixture {
  static readonly explicitAllow: AuthorizationDecision = {
    allowed: true,
    effect: "ALLOW",
    resource: "any",
    action: "any",
    ownerVerified: true,
    auditRequired: true,
    reason: "EXPLICIT_ALLOW",
  };

  static readonly denyByDefault: AuthorizationDecision = {
    allowed: false,
    effect: "DENY",
    resource: "any",
    action: "any",
    ownerVerified: false,
    auditRequired: true,
    reason: "PIPELINE_EXHAUSTED_DEFAULT_DENY",
  };

  static create(allowed: boolean, reason: string): AuthorizationDecision {
    return { 
      allowed, 
      effect: allowed ? "ALLOW" : "DENY",
      resource: "any",
      action: "any",
      ownerVerified: false,
      auditRequired: true,
      reason 
    };
  }
}
