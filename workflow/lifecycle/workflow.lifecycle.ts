import { WorkflowContract, WorkflowStatus } from '../contracts/workflow.contract';

export class WorkflowLifecycle {
  static transition(contract: WorkflowContract, newStatus: WorkflowStatus): WorkflowContract {
     return { ...contract, lifecycle_status: newStatus };
  }
}
