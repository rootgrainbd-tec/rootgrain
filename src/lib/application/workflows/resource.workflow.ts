import { WorkflowContract, WorkflowContext, WorkflowState } from '../contracts/workflow.contract';
import { ResourceApplicationService } from '../services/resource.application.service';

export class ResourceWorkflow implements WorkflowContract<any, any> {
  private service = new ResourceApplicationService();

  async start(input: any): Promise<WorkflowContext<any>> {
    const result = await this.service.execute(input);
    return Object.freeze({
      workflowId: 'wf-res-' + Date.now(),
      state: WorkflowState.COMPLETED,
      payload: Object.freeze(result),
      timestamp: Date.now()
    });
  }

  async compensate(context: WorkflowContext<any>): Promise<void> {
    // Stub: rollback domain entities safely
  }
}
