import { ReportContract } from './report.contract';
import { DataException } from '../exceptions/data.exception';

export class ReportValidator {
  static validate(contract: ReportContract): void {
     if (!contract.report_id || !contract.report_type || !contract.data_source) {
        throw DataException.validation("Report contract missing identifiers");
     }
  }
}
