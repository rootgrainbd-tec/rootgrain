export type FinalReleaseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ValidationStatus = 'VALIDATED' | 'UNVALIDATED' | 'FAILED';

export interface FinalRelease {
  readonly release_id: string;
  readonly version: string;
  readonly commit_reference: string;
  readonly approval_status: FinalReleaseStatus;
  readonly validation_status: ValidationStatus;
}
