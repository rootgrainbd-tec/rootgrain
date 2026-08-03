import { FeatureFlag } from "../types/feature-flag";

export interface IFeatureFlagProvider {
  getFlag(key: string): Promise<FeatureFlag | null>;
}
