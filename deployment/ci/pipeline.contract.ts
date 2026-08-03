export interface PipelineContract {
  readonly pipeline_id: string;
  readonly execution_id: string;
  readonly trigger: 'MANUAL' | 'SCHEDULED' | 'WEBHOOK';
  readonly stages: ReadonlyArray<string>;
}
