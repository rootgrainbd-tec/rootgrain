import { IFeatureFlagEvaluator } from "../contracts/feature-flag-evaluator";
import { FeatureFlag } from "../types/feature-flag";
import { RolloutContext } from "../types/rollout-context";

export class PercentageEvaluator implements IFeatureFlagEvaluator {
  evaluate(flag: FeatureFlag, context: RolloutContext): boolean {
    if (flag.mode !== "PERCENTAGE") return false;
    if (!flag.enabled) return false;
    
    const percentage = flag.percentage ?? 0;
    if (percentage <= 0) return false;
    if (percentage >= 100) return true;

    // Stable bucketing without random or external libs
    const bucket = this.getStableBucket(`${flag.key}:${context.identifier}`);
    return bucket < percentage;
  }

  private getStableBucket(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }
}
