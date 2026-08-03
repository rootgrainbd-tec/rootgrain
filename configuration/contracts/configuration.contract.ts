export type ConfigurationStatus = 'CREATED' | 'REVIEWING' | 'APPROVED' | 'ACTIVE' | 'DEPRECATED' | 'RETIRED';

export interface ConfigurationContract {
  readonly configuration_id: string;
  readonly owner: string;
  readonly scope: string;
  readonly environment: string;
  readonly version: string;
  readonly lifecycle_status: ConfigurationStatus;
}
