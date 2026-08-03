export interface ConfigurationPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
