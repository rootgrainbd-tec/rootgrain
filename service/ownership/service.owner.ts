export interface ServiceOwner {
  readonly owner_id: string;
  readonly service_id: string;
  readonly primary_owner: string;
  readonly backup_owner: string;
  readonly support_scope: string;
  readonly accountability_status: 'ACTIVE' | 'INACTIVE';
}
