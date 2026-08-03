export interface DatabaseContract<TClient, TTransaction = TClient> {
  getClient(): TClient;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
}
