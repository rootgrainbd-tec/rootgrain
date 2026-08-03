export type LifecycleStatus = 'ACTIVE' | 'REVIEWING' | 'ARCHIVED' | 'RESTRICTED';

export interface DataContract {
  readonly data_id: string;
  readonly scope: string;
}
