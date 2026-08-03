import { ContinuityAudit } from './continuity.audit';
import { RecoveryAudit } from './recovery.audit';
import { ContinuityException } from '../exceptions/continuity.exception';

export class AuditValidator {
  static validateRecoveryAudit(audit: RecoveryAudit): void {
     if (!audit.audit_id || !audit.strategy_id) throw ContinuityException.validation("Recovery audit invalid");
  }

  static validateContinuityAudit(audit: ContinuityAudit): void {
     if (!audit.audit_id || !audit.continuity_id) throw ContinuityException.validation("Continuity audit invalid");
  }
}
