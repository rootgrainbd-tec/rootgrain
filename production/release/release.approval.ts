import { FinalReleaseStatus } from './final.release';

export interface ReleaseApproval {
  readonly approval_id: string;
  readonly release_id: string;
  readonly approver: string;
  readonly decision: FinalReleaseStatus;
  readonly timestamp: number;
}
