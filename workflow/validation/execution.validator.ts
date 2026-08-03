import { ExecutionContext } from '../orchestration/execution.context';
import { WorkflowException } from '../exceptions/workflow.exception';

export class ExecutionValidator {
  static validate(context: ExecutionContext): void {
     if (!context.execution_id || !context.workflow_id) {
        throw WorkflowException.validation("Execution context missing identifiers");
     }
  }
}
