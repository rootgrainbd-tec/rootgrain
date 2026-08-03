export interface FeaturePolicy {
  readonly policy_id: string;
  readonly requires_customer_value_mapping: boolean;
  readonly requires_effort_estimation: boolean;
}
