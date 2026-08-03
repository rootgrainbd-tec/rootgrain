export interface FeatureFlagDecision {
  readonly key: string;
  readonly enabled: boolean;
  readonly reason: string;
  readonly contextHash?: string;
}
