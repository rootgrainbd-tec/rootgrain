import { MetricContract } from '../monitoring/metric.contract';

export interface DeploymentMetric extends MetricContract {
  readonly type: 'deployment_status' | 'rollout_progress' | 'release_health';
}
