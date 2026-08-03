export type SupportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type SupportStatus = 'CREATED' | 'TRIAGED' | 'ASSIGNED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

export interface SupportContract {
  readonly support_id: string;
  readonly service_id: string;
  readonly requester: string;
  readonly priority: SupportPriority;
  readonly lifecycle_status: SupportStatus;
}
