export interface ReportContract {
  readonly report_id: string;
  readonly report_type: string;
  readonly data_source: string;
  readonly metric_group: string;
  readonly generation_status: 'PENDING' | 'GENERATED' | 'FAILED';
}
