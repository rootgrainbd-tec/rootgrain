import { AdapterContract } from '../contracts/adapter.contract';
import { HealthStatus } from '../contracts/health.contract';
import { LifecycleState } from '../contracts/lifecycle.contract';

export class ReadinessCheck {
  static isReady(adapter: AdapterContract): boolean {
     return adapter.lifecycle_state === LifecycleState.READY && adapter.health_status === HealthStatus.HEALTHY;
  }
}
