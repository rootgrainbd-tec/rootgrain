import { IFeatureFlagEvaluator } from "../contracts/feature-flag-evaluator";
import { FeatureFlag } from "../types/feature-flag";
import { RolloutContext } from "../types/rollout-context";

export class RuleEvaluator implements IFeatureFlagEvaluator {
  evaluate(flag: FeatureFlag, context: RolloutContext): boolean {
    if (flag.mode !== "RULE_BASED") return false;
    if (!flag.enabled) return false;
    if (!flag.rules || flag.rules.length === 0) return false;

    // ALL rules must match (AND evaluation) for fail-closed safety
    for (const rule of flag.rules) {
      const contextValue = context.attributes[rule.field];
      if (contextValue === undefined) return false; // Missing attribute = fail closed

      const matched = this.evaluateCondition(rule.operator, contextValue, rule.value);
      if (!matched) return false;
    }

    return true;
  }

  private evaluateCondition(operator: string, actual: string, expected: string): boolean {
    switch (operator) {
      case "equals":
        return actual === expected;
      case "not_equals":
        return actual !== expected;
      case "contains":
        return actual.includes(expected);
      case "starts_with":
        return actual.startsWith(expected);
      case "ends_with":
        return actual.endsWith(expected);
      default:
        return false;
    }
  }
}
