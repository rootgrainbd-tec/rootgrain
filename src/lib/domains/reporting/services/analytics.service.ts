import { ReportingRepository } from '../contracts/reporting-repository';
import { AnalyticsReport } from '../types/analytics-report';
import { ReportingValidator } from '../validators/reporting.validator';
import { DashboardValidator } from '../validators/dashboard.validator';

export class AnalyticsService {
  constructor(private readonly repository: ReportingRepository) {}

  async createAnalyticsReport(payload: Partial<AnalyticsReport>): Promise<AnalyticsReport> {
    const basePayload = {
      id: payload.id,
      reference: payload.reference,
      category: payload.category,
      period: payload.period,
      created_at: payload.created_at || new Date()
    };
    
    const validatedBase = ReportingValidator.validateBaseReport(basePayload);
    
    const metrics = (payload.metrics || []).map(m => DashboardValidator.validateMetric(m));
    
    const report: AnalyticsReport = {
      ...validatedBase,
      metrics
    };

    return this.repository.saveReport(report) as Promise<AnalyticsReport>;
  }

  // Pure function to calculate a simple moving average for reporting models
  static calculateMovingAverage(dataPoints: number[], windowSize: number): number[] {
    if (windowSize <= 0 || dataPoints.length === 0) return [];
    
    const result: number[] = [];
    for (let i = 0; i <= dataPoints.length - windowSize; i++) {
      const window = dataPoints.slice(i, i + windowSize);
      const sum = window.reduce((a, b) => a + b, 0);
      result.push(sum / windowSize);
    }
    return result;
  }
}
