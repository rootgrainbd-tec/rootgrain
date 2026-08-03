import { BaseReport } from './analytics-report';
import { TrendInformation } from './dashboard-metric';

export interface FinancialReport extends BaseReport {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  trend: TrendInformation;
}
