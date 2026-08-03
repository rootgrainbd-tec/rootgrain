import { SlaContract } from '../contracts/sla.contract';

export interface SlaRecord {
  readonly record_id: string;
  readonly contract: SlaContract;
  readonly measurements: ReadonlyArray<string>;
}
