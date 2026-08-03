export interface DeploymentContext {
  readonly context_id: string;
  readonly execution_id: string;
  readonly target_environment: string;
  readonly expected_downtime: number;
}
