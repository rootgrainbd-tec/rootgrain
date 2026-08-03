import { EventAdapter } from '../adapters/event.adapter';

export class RedisStreamProvider extends EventAdapter {
  override readonly adapter_id = 'redis_stream_production';
  
  async initialize(): Promise<void> { await super.initialize(); }
  async start(): Promise<void> { await super.start(); }
  async stop(): Promise<void> { await super.stop(); }
  async reconnect(): Promise<void> { await this.stop(); await this.start(); }
}
