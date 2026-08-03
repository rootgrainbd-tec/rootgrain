export interface ExecutionContext {
  readonly execution_id: string;
  readonly workflow_id: string;
  readonly active_tasks: ReadonlyArray<string>;
}
