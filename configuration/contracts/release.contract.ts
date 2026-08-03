export type ReleaseStatus = 'DRAFT' | 'REVIEWING' | 'APPROVED' | 'RELEASED' | 'FAILED' | 'ROLLED_BACK';

export interface ReleaseContract {
  readonly release_id: string;
  readonly version: string;
  readonly change_scope: string;
  readonly validation_status: 'VALIDATED' | 'UNVALIDATED';
  readonly release_status: ReleaseStatus;
}
