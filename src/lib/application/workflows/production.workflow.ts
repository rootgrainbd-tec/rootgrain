import { WorkflowContract, WorkflowContext, WorkflowState } from '../contracts/workflow.contract';
import { ProductionApplicationService } from '../services/production.application.service';

export class ProductionWorkflow implements WorkflowContract<any, any> {
  private service = new ProductionApplicationService();

  async start(input: any): Promise<WorkflowContext<any>> {
    const result = await this.service.execute(input);
    return Object.freeze({
      workflowId: 'wf-prod-' + Date.now(),
      state: WorkflowState.COMPLETED,
      payload: Object.freeze(result),
      timestamp: Date.now()
    });
  }

  async compensate(context: WorkflowContext<any>): Promise<void> {
    // Stub
  }
}
