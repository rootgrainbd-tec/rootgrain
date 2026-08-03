export interface LatencyMetric {
  readonly metric_id: string;
  readonly type: 'response_time' | 'processing_time';
  readonly value_ms: number;
}
