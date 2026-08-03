import { AuthorizationMiddleware } from "../../middleware/authorization.middleware";
import { MockMiddlewareGuard } from "../mocks/middleware.mock";
import { AuthorizationContextFixture } from "../fixtures/authorization-context.fixture";
import { AuthorizationDecisionFixture } from "../fixtures/authorization-decision.fixture";
import { AuthorizationAssertion } from "../assertions/authorization.assertion";

export class MiddlewareIntegration {
  static async verifyPipelineOrder(): Promise<void> {
    const cacheGuard = new MockMiddlewareGuard(null);
    const policyGuard = new MockMiddlewareGuard(null);
    const permissionGuard = new MockMiddlewareGuard(null);
    const ownershipGuard = new MockMiddlewareGuard(null);
    const auditGuard = new MockMiddlewareGuard(null);

    const middleware = new AuthorizationMiddleware(
      cacheGuard as any,
      policyGuard as any,
      permissionGuard as any,
      ownershipGuard as any,
      auditGuard as any
    );

    const decision = await middleware.handle(AuthorizationContextFixture.defaultCustomer);
    
    // An empty pipeline should terminate with explicit DENY_BY_DEFAULT
    AuthorizationAssertion.assertDecisionMatches(decision, AuthorizationDecisionFixture.denyByDefault);
  }
}
