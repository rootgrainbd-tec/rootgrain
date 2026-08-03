export interface GrowthMetric {
  readonly metric_id: string;
  readonly experiment_id: string;
  readonly target_value: number;
  readonly current_value: number;
  readonly statistical_significance: boolean;
}
