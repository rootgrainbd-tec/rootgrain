import { AdapterContract } from '../contracts/adapter.contract';
import { LifecycleState } from '../contracts/lifecycle.contract';
import { HealthStatus } from '../contracts/health.contract';
import { ProviderCategory } from '../contracts/provider.contract';

export class QueueAdapter implements AdapterContract {
  readonly adapter_id: string = 'queue_base';
  readonly provider_type = ProviderCategory.QUEUE;
  readonly capabilities = ['enqueue', 'dequeue'];
  
  lifecycle_state = LifecycleState.REGISTERED;
  health_status = HealthStatus.UNKNOWN;

  async initialize(): Promise<void> { this.lifecycle_state = LifecycleState.INITIALIZED; }
  async start(): Promise<void> { this.lifecycle_state = LifecycleState.READY; this.health_status = HealthStatus.HEALTHY; }
  async stop(): Promise<void> { this.lifecycle_state = LifecycleState.STOPPED; }
  async checkHealth(): Promise<HealthStatus> { return this.health_status; }
}
