export interface RetryContract {
  maxRetries: number;
  backoffMs: number;
  canRetry(attempt: number, error: any): boolean;
}
