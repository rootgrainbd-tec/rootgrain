export interface ProcessContract {
  readonly process_id: string;
  readonly workflow_id: string;
  readonly process_type: string;
  readonly status: 'ACTIVE' | 'INACTIVE';
}
