import { WorkflowContract, WorkflowContext, WorkflowState } from '../contracts/workflow.contract';
import { AccountingApplicationService } from '../services/accounting.application.service';

export class PaymentWorkflow implements WorkflowContract<any, any> {
  private service = new AccountingApplicationService();

  async start(input: any): Promise<WorkflowContext<any>> {
    const result = await this.service.execute(input);
    return Object.freeze({
      workflowId: 'wf-pay-' + Date.now(),
      state: WorkflowState.COMPLETED,
      payload: Object.freeze(result),
      timestamp: Date.now()
    });
  }

  async compensate(context: WorkflowContext<any>): Promise<void> {
    // Stub
  }
}
