import { ComplianceContract } from '../contracts/compliance.contract';

export interface ComplianceReport {
  readonly report_id: string;
  readonly generated_at: number;
  readonly records: ReadonlyArray<ComplianceContract>;
}
