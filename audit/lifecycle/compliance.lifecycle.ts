import { ComplianceContract, ComplianceStatus } from '../contracts/compliance.contract';
import { AuditException } from '../exceptions/audit.exception';

export class ComplianceLifecycle {
  static transition(contract: ComplianceContract, newStatus: ComplianceStatus): ComplianceContract {
     if (contract.status === 'EXEMPTED') {
        throw AuditException.failClosed("Exempted compliance records cannot change status");
     }
     return { ...contract, status: newStatus };
  }
}
