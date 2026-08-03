export interface OwnershipContract {
  readonly ownership_id: string;
  readonly primary_owner: string;
  readonly reviewer: string;
  readonly responsibility_scope: string;
  readonly accountability_status: 'ACTIVE' | 'REVOKED';
}
