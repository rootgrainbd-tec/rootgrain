import { AuditContract } from '../contracts/audit.contract';

export type WorkflowAuditMetadata = {
  workflowId: string;
  durationMs?: number;
  step?: string;
};

export type WorkflowAudit = AuditContract<WorkflowAuditMetadata>;
