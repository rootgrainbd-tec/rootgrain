import { WorkflowContract } from '../contracts/workflow.contract';
import { WorkflowException } from '../exceptions/workflow.exception';

export class WorkflowValidator {
  static validate(contract: WorkflowContract): void {
     if (!contract.workflow_id || !contract.lifecycle_status) {
        throw WorkflowException.validation("Workflow contract missing properties");
     }
  }
}
