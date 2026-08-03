import { AuditContract } from '../contracts/audit.contract';

export type SecurityAuditMetadata = {
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
};

export type SecurityAudit = AuditContract<SecurityAuditMetadata>;
