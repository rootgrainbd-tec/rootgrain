import { AdapterContract } from '../contracts/adapter.contract';

export class ShutdownLifecycle {
  static async execute(adapter: AdapterContract): Promise<void> {
     await adapter.stop();
  }
}
