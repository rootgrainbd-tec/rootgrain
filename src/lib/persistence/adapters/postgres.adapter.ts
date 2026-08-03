import { DatabaseContract } from '../contracts/database.contract';

export class PostgresAdapter<TClient> implements DatabaseContract<TClient, TClient> {
  constructor(private readonly client: TClient) {}

  getClient(): TClient {
    return this.client;
  }

  async connect(): Promise<void> {
    // Stub for Postgres connection logic
  }

  async disconnect(): Promise<void> {
    // Stub for Postgres disconnection logic
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
