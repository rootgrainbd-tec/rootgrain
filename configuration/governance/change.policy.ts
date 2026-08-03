export interface ChangePolicy {
  readonly policy_id: string;
  readonly approval_thresholds: ReadonlyArray<string>;
}
