import { DashboardMetric } from '../types/dashboard-metric';
import { AnalyticsValidator } from './analytics.validator';
import { AnalyticsException } from '../exceptions/analytics.exception';

export class DashboardValidator {
  static validateMetric(metric: Partial<DashboardMetric>): DashboardMetric {
    const errors: Record<string, string[]> = {};

    if (!metric.id || typeof metric.id !== 'string') errors['id'] = ['Required'];
    if (!metric.name || typeof metric.name !== 'string') errors['name'] = ['Required'];
    if (!metric.category || typeof metric.category !== 'string') errors['category'] = ['Required'];

    if (!(metric.calculated_at instanceof Date)) {
      errors['calculated_at'] = ['Required and must be a valid Date object'];
    }

    if (!metric.metric) {
       errors['metric'] = ['Required'];
    }
    
    if (!metric.trend) {
       errors['trend'] = ['Required'];
    }

    if (Object.keys(errors).length > 0) {
      throw new AnalyticsException('Invalid dashboard metric base properties', errors);
    }

    const validatedInfo = AnalyticsValidator.validateMetricInformation(metric.metric!);
    const validatedTrend = AnalyticsValidator.validateTrendInformation(metric.trend!);

    return Object.freeze({
      ...metric,
      metric: validatedInfo,
      trend: validatedTrend
    }) as DashboardMetric;
  }
}
