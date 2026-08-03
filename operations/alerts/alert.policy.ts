import { AlertContract } from './alert.contract';

export interface AlertPolicy {
  readonly policy_id: string;
  readonly evaluate: (metric_value: number) => boolean;
  readonly generate_alert: () => AlertContract;
}
