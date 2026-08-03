export type RecoveryStatus = 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';

export interface RecoveryContract {
  readonly recovery_id: string;
  readonly target_system: string;
  readonly recovery_priority: number;
  readonly recovery_steps: ReadonlyArray<string>;
  readonly recovery_status: RecoveryStatus;
}
