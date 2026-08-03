import { ObservabilityAdapter } from '../adapters/observability.adapter';

export class ConsoleLoggerProvider extends ObservabilityAdapter {
  override readonly adapter_id = 'console_logger';
  
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
