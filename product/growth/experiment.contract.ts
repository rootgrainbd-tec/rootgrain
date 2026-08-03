export type ExperimentStatus = 'PLANNED' | 'RUNNING' | 'VALIDATING' | 'SUCCESSFUL' | 'FAILED';

export interface ExperimentContract {
  readonly experiment_id: string;
  readonly feature_id: string;
  readonly hypothesis: string;
  readonly success_metric: string;
  readonly evaluation_status: ExperimentStatus;
}
