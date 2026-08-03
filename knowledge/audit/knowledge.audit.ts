export type AuditStatus = 'PLANNED' | 'EXECUTING' | 'COMPLETED' | 'FAILED';

export interface KnowledgeAudit {
  readonly audit_id: string;
  readonly target_knowledge: string;
  readonly reviewer: string;
  readonly review_period: string;
  readonly audit_status: AuditStatus;
}
