export type ApiLifecycleStatus = 'DRAFT' | 'REVIEWING' | 'ACTIVE' | 'DEPRECATED' | 'RETIRED';

export interface ApiContract {
  readonly api_id: string;
  readonly version: string;
  readonly owner: string;
  readonly scope: string;
  readonly lifecycle_status: ApiLifecycleStatus;
  readonly compatibility_level: string;
}
