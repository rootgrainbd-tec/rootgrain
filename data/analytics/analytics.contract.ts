export interface AnalyticsContract {
  readonly analytics_id: string;
  readonly metric_name: string;
  readonly calculation_rule: string;
  readonly source_context: string;
  readonly validation_status: 'VALIDATED' | 'UNVALIDATED' | 'FAILED';
}
