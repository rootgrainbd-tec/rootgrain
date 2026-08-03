import { AdapterContract } from '../contracts/adapter.contract';
import { LifecycleState } from '../contracts/lifecycle.contract';
import { HealthStatus } from '../contracts/health.contract';
import { ProviderCategory } from '../contracts/provider.contract';

export class NotificationAdapter implements AdapterContract {
  readonly adapter_id: string = 'notification_base';
  readonly provider_type = ProviderCategory.NOTIFICATION;
  readonly capabilities = ['email', 'sms'];
  
  lifecycle_state = LifecycleState.REGISTERED;
  health_status = HealthStatus.UNKNOWN;

  async initialize(): Promise<void> { this.lifecycle_state = LifecycleState.INITIALIZED; }
  async start(): Promise<void> { this.lifecycle_state = LifecycleState.READY; this.health_status = HealthStatus.HEALTHY; }
  async stop(): Promise<void> { this.lifecycle_state = LifecycleState.STOPPED; }
  async checkHealth(): Promise<HealthStatus> { return this.health_status; }
}
