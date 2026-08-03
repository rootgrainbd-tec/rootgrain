import { RegulatoryReport } from './regulatory.report';
import { AuditException } from '../exceptions/audit.exception';

export class ReportValidator {
  static validate(report: RegulatoryReport): void {
     if (!report.report_id || !report.framework) {
        throw AuditException.validation("Regulatory report missing identifiers");
     }
  }
}
