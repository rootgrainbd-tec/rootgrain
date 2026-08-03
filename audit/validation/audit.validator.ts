import { AuditContract } from '../contracts/audit.contract';
import { AuditException } from '../exceptions/audit.exception';

export class AuditValidator {
  static validate(contract: AuditContract): void {
     if (!contract.audit_id || !contract.lifecycle_status) {
        throw AuditException.validation("Audit contract missing properties");
     }
  }
}
