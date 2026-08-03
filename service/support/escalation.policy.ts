export interface EscalationPolicy {
  readonly policy_id: string;
  readonly escalation_path: string;
  readonly priority_threshold: string;
}
