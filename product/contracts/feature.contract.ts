export type FeatureLifecycleStatus = 'IDEA' | 'EVALUATING' | 'APPROVED' | 'DEVELOPING' | 'RELEASED' | 'DEPRECATED';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FeatureContract {
  readonly feature_id: string;
  readonly feature_name: string;
  readonly customer_value: string;
  readonly priority: PriorityLevel;
  readonly lifecycle_status: FeatureLifecycleStatus;
}
