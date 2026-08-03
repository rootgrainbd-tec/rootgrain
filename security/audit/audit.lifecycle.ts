import { SecurityAudit, AuditState } from './security.audit';

export class AuditLifecycle {
  static transition(audit: SecurityAudit, newState: AuditState): SecurityAudit {
     return { ...audit, state: newState };
  }
}
