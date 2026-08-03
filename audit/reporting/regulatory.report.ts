export interface RegulatoryReport {
  readonly report_id: string;
  readonly report_type: string;
  readonly framework: string;
  readonly reporting_period: string;
  readonly validation_status: 'DRAFT' | 'VALIDATED' | 'SUBMITTED';
}
