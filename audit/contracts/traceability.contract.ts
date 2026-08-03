export interface TraceabilityContract {
  readonly trace_id: string;
  readonly actor: string;
  readonly action: string;
  readonly resource: string;
  readonly timestamp: number;
  readonly outcome: string;
}
