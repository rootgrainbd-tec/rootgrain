export enum TaskState {
  CREATED = 'CREATED',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  CANCELLED = 'CANCELLED'
}

export interface ExecutionContext {
  taskId: string;
  taskType: string;
  state: TaskState;
  payload: any;
  attempt: number;
  metadata: Readonly<Record<string, any>>;
}
