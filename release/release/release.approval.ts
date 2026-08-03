export interface ReleaseApproval {
  readonly approval_id: string;
  readonly release_id: string;
  readonly approver: string;
  readonly decision: 'APPROVED' | 'REJECTED';
  readonly timestamp: number;
}
