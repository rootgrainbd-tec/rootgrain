import { SecurityAudit } from './security.audit';
import { AuditLifecycle } from './audit.lifecycle';

export class AuditWorkflow {
  static startAudit(audit: SecurityAudit): SecurityAudit {
     return AuditLifecycle.transition(audit, 'EXECUTING');
  }
}
