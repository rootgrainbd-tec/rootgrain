import { MigrationLogger } from './migration.logger';

export interface AuditRecord {
  migrationId: string;
  status: 'APPLIED' | 'ROLLED_BACK' | 'FAILED';
  executedAt: Date;
  durationMs: number;
  checksum: string;
}

export class MigrationAudit {
  private records: AuditRecord[] = [];

  recordAction(record: AuditRecord): void {
    this.records.push(Object.freeze(record));
    MigrationLogger.log(`Audit: Migration ${record.migrationId} - ${record.status}`);
  }

  getHistory(): ReadonlyArray<AuditRecord> {
    return Object.freeze([...this.records]);
  }
}
