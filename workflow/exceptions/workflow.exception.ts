export class WorkflowException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowException';
  }

  static validation(message: string): WorkflowException {
    return new WorkflowException(`Workflow Validation Failed: ${message}`);
  }

  static failClosed(message: string): WorkflowException {
    return new WorkflowException(`Fail Closed Workflow Decision: ${message}`);
  }
}
