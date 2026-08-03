import { MetricContract } from '../monitoring/metric.contract';

export interface ApplicationMetric extends MetricContract {
  readonly type: 'request_latency' | 'error_rate' | 'throughput';
}
