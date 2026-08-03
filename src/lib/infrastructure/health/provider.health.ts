import { HealthStatus, HealthContract } from '../contracts/health.contract';
import { LifecycleState } from '../contracts/lifecycle.contract';
import { AdapterContract } from '../contracts/adapter.contract';

export class ProviderHealth {
  static async check(adapter: AdapterContract): Promise<HealthStatus> {
     if (adapter.lifecycle_state !== LifecycleState.READY) {
       return HealthStatus.UNKNOWN;
     }
     try {
       return await adapter.checkHealth();
     } catch {
       return HealthStatus.UNHEALTHY;
     }
  }
}
