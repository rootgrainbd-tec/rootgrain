export interface LaunchApproval {
  readonly approval_id: string;
  readonly launch_id: string;
  readonly approver: string;
  readonly decision: 'APPROVED' | 'REJECTED';
}
