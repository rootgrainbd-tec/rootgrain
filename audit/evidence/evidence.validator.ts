import { EvidenceContract } from '../contracts/evidence.contract';
import { AuditException } from '../exceptions/audit.exception';

export class EvidenceValidator {
  static validate(contract: EvidenceContract): void {
     if (!contract.evidence_id || !contract.integrity_status) {
        throw AuditException.validation("Evidence contract missing properties");
     }
  }
}
