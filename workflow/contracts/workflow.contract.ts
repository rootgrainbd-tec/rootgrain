export type WorkflowStatus = 'DRAFT' | 'REVIEWING' | 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'RETIRED';

export interface WorkflowContract {
  readonly workflow_id: string;
  readonly workflow_name: string;
  readonly owner: string;
  readonly scope: string;
  readonly lifecycle_status: WorkflowStatus;
  readonly version: string;
}
