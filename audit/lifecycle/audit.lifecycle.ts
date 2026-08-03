import { AuditContract, AuditStatus } from '../contracts/audit.contract';
import { AuditException } from '../exceptions/audit.exception';

export class AuditLifecycle {
  static transition(contract: AuditContract, newStatus: AuditStatus): AuditContract {
     if (contract.lifecycle_status === 'ARCHIVED') {
        throw AuditException.failClosed("Archived audits cannot change status");
     }
     return { ...contract, lifecycle_status: newStatus };
  }
}
