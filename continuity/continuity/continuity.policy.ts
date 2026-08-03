export interface ContinuityPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
  readonly requires_validation: boolean;
}
