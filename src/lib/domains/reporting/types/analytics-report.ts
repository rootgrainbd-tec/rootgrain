import { REPORT_CATEGORIES, AGGREGATION_PERIODS } from '../constants/reporting.constants';
import { DashboardMetric } from './dashboard-metric';

export type ReportCategory = typeof REPORT_CATEGORIES[keyof typeof REPORT_CATEGORIES];
export type AggregationPeriod = typeof AGGREGATION_PERIODS[keyof typeof AGGREGATION_PERIODS];

export interface BaseReport {
  id: string;
  reference: string;
  category: ReportCategory;
  period: AggregationPeriod;
  
  created_at: Date;
  generated_at?: Date;
  completed_at?: Date;
}

export interface AnalyticsReport extends BaseReport {
  metrics: DashboardMetric[];
}
