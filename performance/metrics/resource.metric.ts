export interface ResourceMetric {
  readonly metric_id: string;
  readonly type: 'cpu_usage' | 'memory_usage' | 'resource_efficiency';
  readonly value_percent: number;
}
