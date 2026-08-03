import { FeatureFlagDecision } from "../types/feature-flag-decision";

export interface IFeatureFlagCache {
  getDecision(key: string, contextHash: string): Promise<FeatureFlagDecision | null>;
  setDecision(key: string, contextHash: string, decision: FeatureFlagDecision): Promise<void>;
}
