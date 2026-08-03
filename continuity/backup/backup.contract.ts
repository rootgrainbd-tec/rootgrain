export type BackupType = 'FULL' | 'INCREMENTAL' | 'SNAPSHOT';

export interface BackupContract {
  readonly backup_id: string;
  readonly backup_type: BackupType;
  readonly timestamp: number;
}
