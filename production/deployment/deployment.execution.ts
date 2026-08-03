export interface DeploymentExecution {
  readonly execution_id: string;
  readonly release_id: string;
  readonly status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  readonly start_time: number;
  readonly completion_time?: number;
}
