export interface LaunchExecution {
  readonly launch_id: string;
  readonly release_id: string;
  readonly execution_status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'ABORTED';
  readonly initiated_at: number;
}
