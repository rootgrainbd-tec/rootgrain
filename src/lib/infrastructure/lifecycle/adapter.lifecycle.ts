import { AdapterContract } from '../contracts/adapter.contract';
import { LifecycleState } from '../contracts/lifecycle.contract';
import { InfrastructureException } from '../exceptions/infrastructure.exception';

export class AdapterLifecycle {
  static enforceState(adapter: AdapterContract, expected: LifecycleState): void {
     if (adapter.lifecycle_state !== expected) {
        throw InfrastructureException.lifecycle(`Adapter ${adapter.adapter_id} invalid state. Expected ${expected}, got ${adapter.lifecycle_state}`);
     }
  }
}
