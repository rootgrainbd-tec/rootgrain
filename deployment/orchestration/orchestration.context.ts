export interface OrchestrationContext {
  readonly deployment_id: string;
  readonly environment: string;
  readonly gates_passed: ReadonlyArray<string>;
}
