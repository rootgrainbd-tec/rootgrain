export interface ServicePolicy {
  readonly policy_id: string;
  readonly operational_rules: ReadonlyArray<string>;
}
