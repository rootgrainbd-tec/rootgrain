export type EnvironmentType = 'LOCAL' | 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';

export interface EnvironmentContract {
  readonly environment_id: string;
  readonly environment_type: EnvironmentType;
  readonly configuration_scope: string;
  readonly validation_status: 'VALIDATED' | 'UNVALIDATED';
  readonly ownership: string;
}
