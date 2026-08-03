import { EvidenceContract, IntegrityStatus } from '../contracts/evidence.contract';
import { AuditException } from '../exceptions/audit.exception';

export class EvidenceLifecycle {
  static transition(contract: EvidenceContract, newStatus: IntegrityStatus): EvidenceContract {
     if (contract.integrity_status === 'INVALID' || contract.integrity_status === 'EXPIRED') {
        throw AuditException.failClosed("Invalid or expired evidence cannot change status");
     }
     return { ...contract, integrity_status: newStatus };
  }
}
