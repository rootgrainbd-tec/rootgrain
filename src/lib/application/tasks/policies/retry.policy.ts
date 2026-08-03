import { RetryContract } from '../contracts/retry.contract';
import { TaskException } from '../exceptions/task.exception';

export class RetryPolicy {
  static evaluate(contract: RetryContract, currentAttempt: number, error: any): boolean {
    if (!contract) return false;
    
    if (currentAttempt >= contract.maxRetries) {
       return false;
    }
    
    if (!contract.canRetry(currentAttempt, error)) {
       return false;
    }

    return true;
  }

  static getDelay(contract: RetryContract, currentAttempt: number): number {
    if (!contract) throw TaskException.policy('No retry contract defined');
    // Basic linear backoff stub
    return contract.backoffMs * (currentAttempt + 1);
  }
}
