export interface OpportunityContract {
  readonly opportunity_id: string;
  readonly customer_problem: string;
  readonly proposed_value: string;
  readonly expected_impact: number;
  readonly validation_status: 'VALIDATED' | 'UNVALIDATED';
}
