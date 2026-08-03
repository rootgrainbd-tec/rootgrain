import { PersistenceAdapter } from '../adapters/persistence.adapter';
import { ConnectionPool } from './connection.pool';

export class PrismaProvider extends PersistenceAdapter {
  override readonly adapter_id = 'prisma_production';
  private pool = new ConnectionPool();
  
  async initialize(): Promise<void> {
    await super.initialize();
  }

  async start(): Promise<void> {
    await super.start();
    await this.pool.acquire();
  }

  async stop(): Promise<void> {
    await super.stop();
    await this.pool.release();
  }

  async reconnect(): Promise<void> {
    await this.stop();
    await this.start();
  }
}
