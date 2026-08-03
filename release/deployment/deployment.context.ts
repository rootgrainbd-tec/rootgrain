export interface DeploymentContext {
  readonly context_id: string;
  readonly release_id: string;
  readonly target_environment: string;
}
