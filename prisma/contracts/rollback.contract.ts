export interface RollbackContract {
  targetMigrationId: string;
  force: boolean;
  executeRollback(): Promise<boolean>;
}
