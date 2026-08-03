import { SchedulerAdapter } from '../adapters/scheduler.adapter';

export class SchedulerProvider extends SchedulerAdapter {
  override readonly adapter_id = 'scheduler_production';
  
  async initialize(): Promise<void> { await super.initialize(); }
  async start(): Promise<void> { await super.start(); }
  async stop(): Promise<void> { await super.stop(); }
  async reconnect(): Promise<void> { await this.stop(); await this.start(); }
}
