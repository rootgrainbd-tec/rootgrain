export type TaskStatus = 'CREATED' | 'ASSIGNED' | 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface TaskContract {
  readonly task_id: string;
  readonly task_type: string;
  readonly owner: string;
  readonly priority: number;
  readonly execution_status: TaskStatus;
}
