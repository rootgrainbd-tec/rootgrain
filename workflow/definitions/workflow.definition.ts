import { WorkflowContract } from '../contracts/workflow.contract';

export interface WorkflowDefinition {
  readonly definition_id: string;
  readonly contract: WorkflowContract;
  readonly entry_process_id: string;
}
