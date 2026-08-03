export interface GovernancePolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
