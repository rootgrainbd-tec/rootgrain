export class ApplicationException extends Error {
  constructor(
    public readonly type: 'WORKFLOW_ERROR' | 'VALIDATION_ERROR' | 'TASK_EXECUTION_ERROR' | 'SYSTEM_ERROR',
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationException';
  }

  static workflow(message: string, details?: Record<string, any>): ApplicationException {
    return new ApplicationException('WORKFLOW_ERROR', message, details);
  }

  static validation(message: string, details?: Record<string, any>): ApplicationException {
    return new ApplicationException('VALIDATION_ERROR', message, details);
  }

  static taskExecution(message: string, details?: Record<string, any>): ApplicationException {
    return new ApplicationException('TASK_EXECUTION_ERROR', message, details);
  }
}
