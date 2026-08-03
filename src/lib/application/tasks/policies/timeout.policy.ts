import { TaskException } from '../exceptions/task.exception';

export class TimeoutPolicy {
  static evaluate(durationMs: number, maxTimeoutMs: number): void {
    if (durationMs > maxTimeoutMs) {
      throw TaskException.policy('Task exceeded maximum timeout', { durationMs, maxTimeoutMs });
    }
  }
}
