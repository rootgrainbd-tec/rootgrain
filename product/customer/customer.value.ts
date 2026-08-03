export interface CustomerValue {
  readonly value_id: string;
  readonly opportunity_id: string;
  readonly defined_metrics: ReadonlyArray<string>;
  readonly validation_method: 'USER_RESEARCH' | 'DATA_ANALYSIS' | 'MARKET_TREND';
}
