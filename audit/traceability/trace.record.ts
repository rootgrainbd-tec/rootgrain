import { TraceabilityContract } from '../contracts/traceability.contract';

export interface TraceRecord {
  readonly record_id: string;
  readonly contract: TraceabilityContract;
}
