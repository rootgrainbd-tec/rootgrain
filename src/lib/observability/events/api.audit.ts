import { AuditContract } from '../contracts/audit.contract';

export type ApiAuditMetadata = {
  method: string;
  path: string;
  statusCode?: number;
  durationMs?: number;
};

export type ApiAudit = AuditContract<ApiAuditMetadata>;
