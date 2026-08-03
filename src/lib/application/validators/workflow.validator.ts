import { WorkflowContext, WorkflowState } from '../contracts/workflow.contract';
import { ApplicationException } from '../exceptions/application.exception';

export class WorkflowValidator {
  static validateState(context: WorkflowContext<any>, expectedState: WorkflowState): void {
    if (context.state !== expectedState) {
      throw ApplicationException.workflow(`Invalid workflow state. Expected ${expectedState}, got ${context.state}`, { workflowId: context.workflowId });
    }
  }
}
