import { ComplianceContract } from '../contracts/compliance.contract';
import { AuditException } from '../exceptions/audit.exception';

export class ComplianceValidator {
  static validate(contract: ComplianceContract): void {
     if (!contract.compliance_id || !contract.status) {
        throw AuditException.validation("Compliance contract missing properties");
     }
  }
}
