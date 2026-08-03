import { AuthorizationMiddleware } from "../../middleware/authorization.middleware";
import { MockMiddlewareGuard } from "../mocks/middleware.mock";
import { MockAuditService } from "../mocks/audit.mock";
import { AuditGuard } from "../../middleware/audit.guard";
import { AuthorizationContextFixture } from "../fixtures/authorization-context.fixture";
import { AuditAssertion } from "../assertions/audit.assertion";

export class AuditE2E {
  static async verifyTerminalAuditLog(): Promise<void> {
    const auditService = new MockAuditService();
    const auditGuard = new AuditGuard(auditService);
    
    // Mock the upstream pipeline to return an allow
    const mockUpstream = new MockMiddlewareGuard({ allowed: true, reason: "MOCK_ALLOW", effect: "ALLOW", resource: "mock", action: "mock", ownerVerified: true, auditRequired: true });

    // Execute audit guard which wraps the execution
    await auditGuard.execute(AuthorizationContextFixture.defaultCustomer, async () => {
      return mockUpstream.execute(AuthorizationContextFixture.defaultCustomer, async () => ({ allowed: false, reason: "FAIL", effect: "DENY", resource: "mock", action: "mock", ownerVerified: false, auditRequired: true }));
    });

    // Verify it was logged exactly once
    AuditAssertion.assertLogCount(auditService, 1);
  }
}
