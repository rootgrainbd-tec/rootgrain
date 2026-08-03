export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface AccessContract {
  readonly request_id: string;
  readonly identity_id: string;
  readonly role_id: string;
  readonly requested_scope: string;
  readonly approval_status: ApprovalStatus;
}
