import { QueueAdapter } from '../adapters/queue.adapter';

export class RedisProvider extends QueueAdapter {
  override readonly adapter_id = 'redis_queue_production';
  
  async initialize(): Promise<void> { await super.initialize(); }
  async start(): Promise<void> { await super.start(); }
  async stop(): Promise<void> { await super.stop(); }
  async reconnect(): Promise<void> { await this.stop(); await this.start(); }
}
