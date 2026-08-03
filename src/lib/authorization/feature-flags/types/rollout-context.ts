export interface RolloutContext {
  readonly identifier: string; // Used for stable hashing in percentage rollout
  readonly attributes: Record<string, string>; // Used for rule-based evaluation
}
