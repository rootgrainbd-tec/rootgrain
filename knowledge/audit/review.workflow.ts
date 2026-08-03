import { KnowledgeAudit, AuditStatus } from './knowledge.audit';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class ReviewWorkflow {
  static transition(audit: KnowledgeAudit, newStatus: AuditStatus): KnowledgeAudit {
     if (audit.audit_status === 'COMPLETED' || audit.audit_status === 'FAILED') {
        throw KnowledgeException.failClosed("Terminal knowledge audits cannot transition states");
     }
     return { ...audit, audit_status: newStatus };
  }
}
