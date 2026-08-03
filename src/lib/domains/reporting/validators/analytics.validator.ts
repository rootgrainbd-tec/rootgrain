import { MetricInformation, TrendInformation } from '../types/dashboard-metric';
import { AnalyticsException } from '../exceptions/analytics.exception';

export class AnalyticsValidator {
  static validateMetricInformation(metric: Partial<MetricInformation>): MetricInformation {
    const errors: Record<string, string[]> = {};

    if (typeof metric.value !== 'number') errors['value'] = ['Must be a number'];
    if (typeof metric.average !== 'number') errors['average'] = ['Must be a number'];
    if (typeof metric.minimum !== 'number') errors['minimum'] = ['Must be a number'];
    if (typeof metric.maximum !== 'number') errors['maximum'] = ['Must be a number'];

    if (typeof metric.minimum === 'number' && typeof metric.maximum === 'number') {
        if (metric.minimum > metric.maximum) {
            errors['integrity'] = ['Minimum cannot be greater than maximum'];
        }
    }

    if (Object.keys(errors).length > 0) {
      throw new AnalyticsException('Invalid metric information', errors);
    }

    return Object.freeze({ ...metric }) as MetricInformation;
  }

  static validateTrendInformation(trend: Partial<TrendInformation>): TrendInformation {
    const errors: Record<string, string[]> = {};

    if (typeof trend.growth_rate !== 'number') errors['growth_rate'] = ['Must be a number'];
    if (typeof trend.variance !== 'number') errors['variance'] = ['Must be a number'];
    if (typeof trend.deviation !== 'number') errors['deviation'] = ['Must be a number'];

    if (Object.keys(errors).length > 0) {
      throw new AnalyticsException('Invalid trend information', errors);
    }

    return Object.freeze({ ...trend }) as TrendInformation;
  }
}
