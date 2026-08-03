import { FeatureFlagDecision } from "../types/feature-flag-decision";

export class FailClosedStrategy {
  static getDecision(key: string, reason: string): FeatureFlagDecision {
    return {
      key,
      enabled: false,
      reason
    };
  }
}
