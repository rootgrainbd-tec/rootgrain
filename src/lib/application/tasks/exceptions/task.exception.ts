export class TaskException extends Error {
  constructor(
    public readonly type: 'LIFECYCLE_ERROR' | 'VALIDATION_ERROR' | 'EXECUTION_ERROR' | 'POLICY_ERROR' | 'QUEUE_ERROR',
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'TaskException';
  }

  static lifecycle(message: string, details?: Record<string, any>): TaskException {
    return new TaskException('LIFECYCLE_ERROR', message, details);
  }

  static validation(message: string, details?: Record<string, any>): TaskException {
    return new TaskException('VALIDATION_ERROR', message, details);
  }

  static execution(message: string, details?: Record<string, any>): TaskException {
    return new TaskException('EXECUTION_ERROR', message, details);
  }

  static policy(message: string, details?: Record<string, any>): TaskException {
    return new TaskException('POLICY_ERROR', message, details);
  }

  static queue(message: string, details?: Record<string, any>): TaskException {
    return new TaskException('QUEUE_ERROR', message, details);
  }
}
