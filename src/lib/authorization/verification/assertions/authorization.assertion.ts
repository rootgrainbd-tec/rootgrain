import { AuthorizationDecision } from "../../types/authorization-decision";
import assert from "assert";

export class AuthorizationAssertion {
  static assertDecisionMatches(actual: AuthorizationDecision, expected: AuthorizationDecision): void {
    assert.strictEqual(actual.allowed, expected.allowed, `Expected allowed to be ${expected.allowed} but got ${actual.allowed}`);
    assert.strictEqual(actual.reason, expected.reason, `Expected reason to be ${expected.reason} but got ${actual.reason}`);
  }

  static assertDenied(actual: AuthorizationDecision): void {
    assert.strictEqual(actual.allowed, false, "Expected decision to be DENIED");
  }

  static assertAllowed(actual: AuthorizationDecision): void {
    assert.strictEqual(actual.allowed, true, "Expected decision to be ALLOWED");
  }
}
