import { TransactionContract } from '../contracts/transaction.contract';
import { TransactionContext } from './transaction.context';
import { PersistenceException } from '../exceptions/persistence.exception';

export class TransactionManager {
  static async runInTransaction<TClient, TResult>(
    transaction: TransactionContract<TClient>,
    operation: (context: TransactionContext<TClient>) => Promise<TResult>
  ): Promise<TResult> {
    await transaction.start();
    const context = new TransactionContext(transaction);
    
    try {
      const result = await operation(context);
      await context.commit();
      return result;
    } catch (error) {
      await context.rollback();
      if (error instanceof PersistenceException) {
         throw error;
      }
      throw new PersistenceException('Transaction execution failed', 'EXECUTION_FAILED');
    }
  }
}
