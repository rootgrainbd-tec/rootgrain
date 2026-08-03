import { EventAdapter } from '../adapters/event.adapter';

export class LocalEventProvider extends EventAdapter {
  override readonly adapter_id = 'local_event';
  
  async initialize(): Promise<void> {
    await super.initialize();
  }

  async start(): Promise<void> {
    await super.start();
  }

  async stop(): Promise<void> {
    await super.stop();
  }
}
