import { BaseReport } from '../types/analytics-report';
import { VALID_REPORT_CATEGORIES, VALID_AGGREGATION_PERIODS } from '../constants/reporting.constants';
import { ReportingException } from '../exceptions/reporting.exception';

export class ReportingValidator {
  static validateBaseReport(report: Partial<BaseReport>): BaseReport {
    const errors: Record<string, string[]> = {};

    if (!report.id || typeof report.id !== 'string') errors['id'] = ['Required'];
    if (!report.reference || typeof report.reference !== 'string') errors['reference'] = ['Required'];
    
    if (!report.category || !VALID_REPORT_CATEGORIES.includes(report.category)) {
      errors['category'] = [`Must be a valid category: ${VALID_REPORT_CATEGORIES.join(', ')}`];
    }
    
    if (!report.period || !VALID_AGGREGATION_PERIODS.includes(report.period)) {
      errors['period'] = [`Must be a valid period: ${VALID_AGGREGATION_PERIODS.join(', ')}`];
    }

    if (!(report.created_at instanceof Date)) {
      errors['created_at'] = ['Required and must be a valid Date object'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ReportingException('Invalid base report data', 'INVALID_REPORT');
    }

    return Object.freeze({ ...report }) as BaseReport;
  }
}
