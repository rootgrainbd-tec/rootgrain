import { LifecycleState, LifecycleContract } from './lifecycle.contract';
import { HealthStatus, HealthContract } from './health.contract';
import { ProviderCategory } from './provider.contract';

export interface AdapterContract extends LifecycleContract, HealthContract {
  readonly adapter_id: string;
  readonly provider_type: ProviderCategory;
  readonly capabilities: ReadonlyArray<string>;
  readonly lifecycle_state: LifecycleState;
  readonly health_status: HealthStatus;
}
