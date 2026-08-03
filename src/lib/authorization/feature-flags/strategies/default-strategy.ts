import { FeatureFlagDecision } from "../types/feature-flag-decision";
import { FeatureFlag } from "../types/feature-flag";
import { RolloutContext } from "../types/rollout-context";
import { BooleanEvaluator } from "../evaluators/boolean-evaluator";
import { PercentageEvaluator } from "../evaluators/percentage-evaluator";
import { RuleEvaluator } from "../evaluators/rule-evaluator";
import { FailClosedStrategy } from "./fail-closed-strategy";

export class DefaultStrategy {
  private booleanEvaluator = new BooleanEvaluator();
  private percentageEvaluator = new PercentageEvaluator();
  private ruleEvaluator = new RuleEvaluator();

  evaluate(flag: FeatureFlag, context: RolloutContext): FeatureFlagDecision {
    try {
      let enabled = false;

      switch (flag.mode) {
        case "BOOLEAN":
          enabled = this.booleanEvaluator.evaluate(flag, context);
          break;
        case "PERCENTAGE":
          enabled = this.percentageEvaluator.evaluate(flag, context);
          break;
        case "RULE_BASED":
          enabled = this.ruleEvaluator.evaluate(flag, context);
          break;
        default:
          return FailClosedStrategy.getDecision(flag.key, "UNKNOWN_MODE");
      }

      return {
        key: flag.key,
        enabled,
        reason: "STRATEGY_EVALUATED"
      };
    } catch (e) {
      return FailClosedStrategy.getDecision(flag.key, "EVALUATION_EXCEPTION");
    }
  }
}
