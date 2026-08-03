import { TraceRecord } from './trace.record';

export interface TraceContext {
  readonly context_id: string;
  readonly traces: ReadonlyArray<TraceRecord>;
}
