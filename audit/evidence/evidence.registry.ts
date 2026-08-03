import { EvidenceRecord } from './evidence.record';
import { AuditException } from '../exceptions/audit.exception';

export class EvidenceRegistry {
  private static evidence = new Map<string, EvidenceRecord>();

  static register(record: EvidenceRecord): void {
     if (this.evidence.has(record.record_id)) {
        throw AuditException.validation("Duplicate Evidence ID");
     }
     this.evidence.set(record.record_id, record);
  }
}
