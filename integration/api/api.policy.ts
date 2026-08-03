export interface ApiPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
