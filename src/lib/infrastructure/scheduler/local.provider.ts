import { SchedulerAdapter } from '../adapters/scheduler.adapter';

export class LocalSchedulerProvider extends SchedulerAdapter {
  override readonly adapter_id = 'local_scheduler';
  
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
