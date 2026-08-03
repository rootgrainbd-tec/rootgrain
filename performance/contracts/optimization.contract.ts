export type OptimizationState = 'IDENTIFIED' | 'ANALYZING' | 'PLANNED' | 'VALIDATING' | 'IMPLEMENTED' | 'REJECTED';

export interface OptimizationContract {
  readonly optimization_id: string;
  readonly target_metric: string;
  readonly baseline_value: number;
  readonly expected_improvement: number;
  readonly state: OptimizationState;
}
