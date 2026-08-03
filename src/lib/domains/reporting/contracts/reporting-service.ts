import { BaseReport } from '../types/analytics-report';
import { DashboardMetric } from '../types/dashboard-metric';

export interface ReportingServiceContract {
  generateReport(category: string, period: string): Promise<BaseReport>;
  saveMetric(metric: Partial<DashboardMetric>): Promise<DashboardMetric>;
  markReportCompleted(reportId: string): Promise<void>;
}
