export interface TraceContract {
  readonly trace_id: string;
  readonly request_id: string;
  readonly correlation_id: string;
  readonly timestamp: number;
}
