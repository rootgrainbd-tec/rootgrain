export interface ScalabilityPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
  readonly evaluation_interval_ms: number;
}
