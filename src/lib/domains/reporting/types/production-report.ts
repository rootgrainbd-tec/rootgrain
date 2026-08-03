import { BaseReport } from './analytics-report';

export interface ProductionReport extends BaseReport {
  total_batches: number;
  completed_batches: number;
  defective_batches: number;
  efficiency_rate: number;
}
