import { SecurityAudit } from './security.audit';
import { SecurityException } from '../exceptions/security.exception';

export class AuditValidator {
  static validate(audit: SecurityAudit): void {
     if (!audit.audit_id || !audit.state) {
        throw SecurityException.validation("Audit is missing required operational identifiers");
     }
  }
}
