export interface SupportPolicy {
  readonly policy_id: string;
  readonly triage_rules: ReadonlyArray<string>;
}
