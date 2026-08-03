import { AdapterContract } from '../contracts/adapter.contract';
import { LifecycleState } from '../contracts/lifecycle.contract';

export class StartupLifecycle {
  static async execute(adapter: AdapterContract): Promise<void> {
     if (adapter.lifecycle_state === LifecycleState.REGISTERED) {
       await adapter.initialize();
     }
     if (adapter.lifecycle_state === LifecycleState.INITIALIZED) {
       await adapter.start();
     }
  }
}
