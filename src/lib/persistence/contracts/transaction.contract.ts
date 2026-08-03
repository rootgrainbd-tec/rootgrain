export interface TransactionContract<TClient> {
  start(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  getClient(): TClient;
}
