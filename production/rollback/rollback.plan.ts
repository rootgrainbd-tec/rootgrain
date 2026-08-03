export interface RollbackPlan {
  readonly rollback_id: string;
  readonly target_release: string;
  readonly rollback_reason: string;
  readonly recovery_steps: ReadonlyArray<string>;
  readonly validation_status: 'VALIDATED' | 'UNVALIDATED';
}
