export interface IntegrationPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
