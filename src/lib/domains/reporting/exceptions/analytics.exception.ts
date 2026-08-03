import { ReportingException } from './reporting.exception';

export class AnalyticsException extends ReportingException {
  constructor(message: string, public readonly errors: Record<string, string[]>) {
    super(message, 'ANALYTICS_OPERATION_FAILED');
    this.name = 'AnalyticsException';
  }
}
