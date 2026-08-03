export type IdentityStatus = 'CREATED' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'RETIRED';

export interface IdentityContract {
  readonly identity_id: string;
  readonly owner: string;
  readonly scope: string;
  readonly governance_status: IdentityStatus;
  readonly lifecycle_version: string;
}
