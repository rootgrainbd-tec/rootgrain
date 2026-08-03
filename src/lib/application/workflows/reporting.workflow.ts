import { WorkflowContract, WorkflowContext, WorkflowState } from '../contracts/workflow.contract';
import { ReportingApplicationService } from '../services/reporting.application.service';

export class ReportingWorkflow implements WorkflowContract<any, any> {
  private service = new ReportingApplicationService();

  async start(input: any): Promise<WorkflowContext<any>> {
    const result = await this.service.execute(input);
    return Object.freeze({
      workflowId: 'wf-rep-' + Date.now(),
      state: WorkflowState.COMPLETED,
      payload: Object.freeze(result),
      timestamp: Date.now()
    });
  }

  async compensate(context: WorkflowContext<any>): Promise<void> {
    // Stub
  }
}
