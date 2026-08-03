export interface EfficiencyPolicy {
  readonly policy_id: string;
  readonly targets: Readonly<Record<string, number>>;
}
