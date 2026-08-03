export interface ChangeApproval {
  readonly approval_id: string;
  readonly change_id: string;
  readonly approver: string;
  readonly decision: 'APPROVED' | 'REJECTED';
  readonly timestamp: number;
  readonly justification: string;
}
