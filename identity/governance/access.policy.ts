export interface AccessPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
