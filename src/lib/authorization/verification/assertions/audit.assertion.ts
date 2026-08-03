import assert from "assert";
import { MockAuditService } from "../mocks/audit.mock";

export class AuditAssertion {
  static assertLogCount(auditService: MockAuditService, expectedCount: number): void {
    assert.strictEqual(auditService.logs.length, expectedCount, `Expected ${expectedCount} audit logs, but found ${auditService.logs.length}`);
  }

  static assertLoggedAction(auditService: MockAuditService, action: string): void {
    const found = auditService.logs.some(log => log.ctx.action === action);
    assert.ok(found, `Expected action ${action} to be logged`);
  }
}
