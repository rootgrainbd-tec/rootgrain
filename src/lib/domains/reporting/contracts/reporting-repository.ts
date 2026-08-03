import { BaseReport } from '../types/analytics-report';
import { DashboardMetric } from '../types/dashboard-metric';

export interface ReportingRepository {
  findReportById(id: string): Promise<BaseReport | null>;
  findMetricById(id: string): Promise<DashboardMetric | null>;
  saveReport(report: BaseReport): Promise<BaseReport>;
  updateReport(id: string, updates: Partial<BaseReport>): Promise<BaseReport>;
  saveMetric(metric: DashboardMetric): Promise<DashboardMetric>;
}
