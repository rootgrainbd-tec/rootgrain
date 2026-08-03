export type AuditState = 'CREATED' | 'PLANNED' | 'EXECUTING' | 'REVIEWING' | 'COMPLETED' | 'FAILED';

export interface SecurityAudit {
  readonly audit_id: string;
  readonly target_scope: string;
  readonly auditor: string;
  readonly state: AuditState;
}
