import { AuditContract } from '../contracts/audit.contract';

export interface GovernanceContext {
  readonly context_id: string;
  readonly target_audit: AuditContract;
}
