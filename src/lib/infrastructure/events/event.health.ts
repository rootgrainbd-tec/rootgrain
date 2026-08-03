import { HealthStatus } from '../contracts/health.contract';
import { AdapterContract } from '../contracts/adapter.contract';

export class EventHealth {
  static async check(adapter: AdapterContract): Promise<HealthStatus> {
     return await adapter.checkHealth();
  }
}
