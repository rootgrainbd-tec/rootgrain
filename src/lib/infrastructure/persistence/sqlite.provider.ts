import { PersistenceAdapter } from '../adapters/persistence.adapter';

export class SqliteProvider extends PersistenceAdapter {
  override readonly adapter_id = 'sqlite_persistence';
  
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
