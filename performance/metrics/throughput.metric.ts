export interface ThroughputMetric {
  readonly metric_id: string;
  readonly type: 'requests_per_second' | 'transactions_per_second';
  readonly value: number;
}
