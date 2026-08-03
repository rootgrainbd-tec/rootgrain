import { WorkflowContract, WorkflowContext, WorkflowState } from '../contracts/workflow.contract';
import { OrderApplicationService } from '../services/order.application.service';

export class OrderWorkflow implements WorkflowContract<any, any> {
  private service = new OrderApplicationService();

  async start(input: any): Promise<WorkflowContext<any>> {
    const result = await this.service.execute(input);
    return Object.freeze({
      workflowId: 'wf-ord-' + Date.now(),
      state: WorkflowState.COMPLETED,
      payload: Object.freeze(result),
      timestamp: Date.now()
    });
  }

  async compensate(context: WorkflowContext<any>): Promise<void> {
    // Stub
  }
}
