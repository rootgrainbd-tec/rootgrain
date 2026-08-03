export type RoleStatus = 'DRAFT' | 'REVIEWING' | 'ACTIVE' | 'SUSPENDED' | 'RETIRED';

export interface RoleContract {
  readonly role_id: string;
  readonly role_name: string;
  readonly permission_scope: string;
  readonly owner: string;
  readonly lifecycle_status: RoleStatus;
}
