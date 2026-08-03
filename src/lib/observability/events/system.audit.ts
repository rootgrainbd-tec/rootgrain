import { AuditContract } from '../contracts/audit.contract';

export type SystemAuditMetadata = {
  component: string;
  version: string;
  details?: Record<string, any>;
};

export type SystemAudit = AuditContract<SystemAuditMetadata>;
