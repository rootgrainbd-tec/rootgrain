import { KnowledgeAudit } from './knowledge.audit';
import { KnowledgeException } from '../exceptions/knowledge.exception';

export class AuditValidator {
  static validate(audit: KnowledgeAudit): void {
     if (!audit.audit_id || !audit.target_knowledge) {
        throw KnowledgeException.validation("Knowledge audit missing targets");
     }
  }
}
