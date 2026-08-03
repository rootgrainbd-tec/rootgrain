import { PersistenceAdapter } from '../adapters/persistence.adapter';

export class PostgresProvider extends PersistenceAdapter {
  override readonly adapter_id = 'postgres_persistence';
  
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
