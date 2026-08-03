export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface ApprovalContract {
  readonly approval_id: string;
  readonly approval_status: ApprovalStatus;
}
