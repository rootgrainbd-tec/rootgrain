export interface ProductPolicy {
  readonly policy_id: string;
  readonly allows_new_features: boolean;
  readonly requires_roi_validation: boolean;
}
