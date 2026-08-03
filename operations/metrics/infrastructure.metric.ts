import { MetricContract } from '../monitoring/metric.contract';

export interface InfrastructureMetric extends MetricContract {
  readonly type: 'dependency_health' | 'resource_health' | 'availability';
}
