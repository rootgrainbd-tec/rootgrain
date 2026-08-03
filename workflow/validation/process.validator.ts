import { ProcessContract } from '../contracts/process.contract';
import { WorkflowException } from '../exceptions/workflow.exception';

export class ProcessValidator {
  static validate(contract: ProcessContract): void {
     if (!contract.process_id || !contract.workflow_id) {
        throw WorkflowException.validation("Process contract missing identifiers");
     }
  }
}
