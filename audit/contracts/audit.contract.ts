export type AuditStatus = 'CREATED' | 'PLANNED' | 'EXECUTING' | 'REVIEWING' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';

export interface AuditContract {
  readonly audit_id: string;
  readonly audit_type: string;
  readonly owner: string;
  readonly scope: string;
  readonly lifecycle_status: AuditStatus;
  readonly created_at: number;
}
