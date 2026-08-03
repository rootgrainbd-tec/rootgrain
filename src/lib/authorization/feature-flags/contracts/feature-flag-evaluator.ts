import { FeatureFlag } from "../types/feature-flag";
import { RolloutContext } from "../types/rollout-context";

export interface IFeatureFlagEvaluator {
  evaluate(flag: FeatureFlag, context: RolloutContext): boolean;
}
