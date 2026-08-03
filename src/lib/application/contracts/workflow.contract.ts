export enum WorkflowState {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK'
}

export interface WorkflowContext<T> {
  readonly workflowId: string;
  readonly state: WorkflowState;
  readonly payload: Readonly<T>;
  readonly timestamp: number;
}

export interface WorkflowContract<TInput, TOutput> {
  start(input: TInput): Promise<WorkflowContext<TOutput>>;
  compensate(context: WorkflowContext<any>): Promise<void>;
}
