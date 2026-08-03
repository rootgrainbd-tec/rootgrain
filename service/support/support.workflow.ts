import { SupportContract } from '../contracts/support.contract';

export interface SupportWorkflow {
  readonly workflow_id: string;
  readonly contract: SupportContract;
  readonly request_type: string;
  readonly escalation_path: string;
  readonly resolution_status: 'PENDING' | 'RESOLVED';
}
