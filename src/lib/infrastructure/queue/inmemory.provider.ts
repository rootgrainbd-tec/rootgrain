import { QueueAdapter } from '../adapters/queue.adapter';

export class InMemoryQueueProvider extends QueueAdapter {
  override readonly adapter_id = 'inmemory_queue';
  
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
