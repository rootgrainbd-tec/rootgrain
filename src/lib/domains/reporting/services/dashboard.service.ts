import { DashboardMetric, TrendInformation } from '../types/dashboard-metric';
import { AnalyticsValidator } from '../validators/analytics.validator';

export class DashboardService {
  
  // Pure logic helper to determine trend direction safely
  static calculateVariance(currentValue: number, previousValue: number): number {
    if (previousValue === 0) {
       if (currentValue === 0) return 0;
       return currentValue > 0 ? 100 : -100; // Representing infinity / edge cases simply for domain logic
    }
    
    const variance = ((currentValue - previousValue) / previousValue) * 100;
    return variance;
  }

  static applyTrend(metric: DashboardMetric, currentValue: number, previousValue: number): DashboardMetric {
    const variance = this.calculateVariance(currentValue, previousValue);
    
    const trendPayload: Partial<TrendInformation> = {
      growth_rate: variance,
      variance: currentValue - previousValue,
      deviation: 0 // Mocked for structure
    };

    const validatedTrend = AnalyticsValidator.validateTrendInformation(trendPayload);

    return Object.freeze({
       ...metric,
       trend: validatedTrend
    }) as DashboardMetric;
  }
}
