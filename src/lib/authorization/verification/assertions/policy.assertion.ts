import assert from "assert";

export class PolicyAssertion {
  static assertEffect(actualEffect: string, expectedEffect: string): void {
    assert.strictEqual(actualEffect, expectedEffect, `Expected policy effect to be ${expectedEffect}, got ${actualEffect}`);
  }
}
