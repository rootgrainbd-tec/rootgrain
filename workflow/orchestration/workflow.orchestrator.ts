import { WorkflowContract, WorkflowStatus } from '../contracts/workflow.contract';
import { WorkflowException } from '../exceptions/workflow.exception';

export class WorkflowOrchestrator {
  static transitionState(contract: WorkflowContract, newState: WorkflowStatus): WorkflowContract {
     if (contract.lifecycle_status === 'RETIRED') {
        throw WorkflowException.failClosed("Retired workflows cannot transition states");
     }
     return { ...contract, lifecycle_status: newState };
  }
}
