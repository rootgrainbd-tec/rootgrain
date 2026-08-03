export enum Environment {
  LOCAL = 'LOCAL',
  DEVELOPMENT = 'DEVELOPMENT',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION'
}

export enum DeploymentState {
  CREATED = 'CREATED',
  VALIDATED = 'VALIDATED',
  DEPLOYING = 'DEPLOYING',
  ACTIVE = 'ACTIVE',
  DEGRADED = 'DEGRADED',
  ROLLING_BACK = 'ROLLING_BACK',
  FAILED = 'FAILED'
}

export interface DeploymentManifest {
  readonly deployment_id: string;
  readonly application_version: string;
  readonly environment: Environment;
  readonly release_channel: string;
  readonly deployment_state: DeploymentState;
  readonly created_at: number;
}
