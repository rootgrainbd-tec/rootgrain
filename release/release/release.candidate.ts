export type ReleaseStatus = 'DRAFT' | 'VALIDATING' | 'APPROVED' | 'READY' | 'RELEASED' | 'REJECTED';

export interface ReleaseCandidate {
  readonly release_id: string;
  readonly version: string;
  readonly commit_reference: string;
  readonly validation_status: 'PENDING' | 'VALIDATED' | 'FAILED';
  readonly approval_status: ReleaseStatus;
}
