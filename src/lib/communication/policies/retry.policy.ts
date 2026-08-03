export interface RetryPolicyContract {
  maxRetries: number;
  backoffMs: number;
}

export class RetryPolicy {
  static evaluate(contract: RetryPolicyContract, currentAttempt: number): boolean {
    return currentAttempt < contract.maxRetries;
  }
}
