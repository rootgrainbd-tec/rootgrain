import { AdapterContract } from '../contracts/adapter.contract';
import { ProviderHealth } from './provider.health';
import { HealthStatus } from '../contracts/health.contract';

export class InfrastructureHealth {
  static async checkAll(adapters: AdapterContract[]): Promise<boolean> {
     for (const adapter of adapters) {
        const status = await ProviderHealth.check(adapter);
        if (status !== HealthStatus.HEALTHY) return false;
     }
     return true;
  }
}
