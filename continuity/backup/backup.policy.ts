import { BackupType } from './backup.contract';

export interface BackupPolicy {
  readonly policy_id: string;
  readonly backup_type: BackupType;
  readonly frequency: string;
  readonly retention_policy: string;
  readonly validation_status: 'VALIDATED' | 'UNVALIDATED';
}
