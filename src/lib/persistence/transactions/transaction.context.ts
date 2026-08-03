import { TransactionContract } from '../contracts/transaction.contract';
import { PersistenceException } from '../exceptions/persistence.exception';

export class TransactionContext<TClient> {
  constructor(private readonly transaction: TransactionContract<TClient>) {}

  getClient(): TClient {
    return this.transaction.getClient();
  }

  async commit(): Promise<void> {
    try {
      await this.transaction.commit();
    } catch (error) {
      throw new PersistenceException('Transaction commit failed', 'COMMIT_FAILED');
    }
  }

  async rollback(): Promise<void> {
    try {
      await this.transaction.rollback();
    } catch (error) {
      throw new PersistenceException('Transaction rollback failed', 'ROLLBACK_FAILED');
    }
  }
}
