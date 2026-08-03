import { BaseReport } from '../types/analytics-report';
import { DashboardMetric } from '../types/dashboard-metric';

export interface ReportingProvider {
  getReport(id: string): Promise<BaseReport | null>;
  getMetricsByCategory(category: string): Promise<DashboardMetric[]>;
  getReportsByPeriod(period: string): Promise<BaseReport[]>;
}
