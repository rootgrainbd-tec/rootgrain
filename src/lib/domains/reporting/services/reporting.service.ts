import { ReportingServiceContract } from '../contracts/reporting-service';
import { ReportingRepository } from '../contracts/reporting-repository';
import { BaseReport } from '../types/analytics-report';
import { DashboardMetric } from '../types/dashboard-metric';
import { ReportingValidator } from '../validators/reporting.validator';
import { DashboardValidator } from '../validators/dashboard.validator';
import { ReportingException } from '../exceptions/reporting.exception';
import { randomUUID } from 'crypto';

// Note: AuthorizationMiddleware wraps all entries here
export class ReportingService implements ReportingServiceContract {
  constructor(private readonly repository: ReportingRepository) {}

  async generateReport(category: string, period: string): Promise<BaseReport> {
    const payload: Partial<BaseReport> = {
      id: randomUUID(),
      reference: `REP-${Date.now()}`,
      category: category as any,
      period: period as any,
      created_at: new Date()
    };

    const validatedReport = ReportingValidator.validateBaseReport(payload);
    
    return this.repository.saveReport(validatedReport);
  }

  async saveMetric(metricPayload: Partial<DashboardMetric>): Promise<DashboardMetric> {
    const validatedMetric = DashboardValidator.validateMetric(metricPayload);
    
    return this.repository.saveMetric(validatedMetric);
  }

  async markReportCompleted(reportId: string): Promise<void> {
    const existing = await this.repository.findReportById(reportId);
    if (!existing) throw new ReportingException(`Report not found: ${reportId}`, 'NOT_FOUND');
    
    if (existing.completed_at) {
       throw new ReportingException(`Report already marked as completed`, 'INVALID_TRANSITION');
    }

    await this.repository.updateReport(reportId, { completed_at: new Date() });
  }
}
