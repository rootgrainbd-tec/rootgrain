export interface TaskMonitorContract {
  recordStart(taskId: string): void;
  recordSuccess(taskId: string, durationMs: number): void;
  recordFailure(taskId: string, error: any, durationMs: number): void;
  recordRetry(taskId: string, attempt: number): void;
}
