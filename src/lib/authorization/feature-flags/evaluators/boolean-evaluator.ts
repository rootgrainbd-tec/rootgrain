import { IFeatureFlagEvaluator } from "../contracts/feature-flag-evaluator";
import { FeatureFlag } from "../types/feature-flag";
import { RolloutContext } from "../types/rollout-context";

export class BooleanEvaluator implements IFeatureFlagEvaluator {
  evaluate(flag: FeatureFlag, context: RolloutContext): boolean {
    if (flag.mode !== "BOOLEAN") return false;
    return flag.enabled === true;
  }
}
