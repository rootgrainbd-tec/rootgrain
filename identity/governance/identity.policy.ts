export interface IdentityPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
