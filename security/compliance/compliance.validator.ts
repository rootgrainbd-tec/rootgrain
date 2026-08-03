import { ComplianceContext } from './compliance.context';
import { SecurityException } from '../exceptions/security.exception';

export class ComplianceValidator {
  static validate(context: ComplianceContext): void {
     if (!context.compliance_id) {
        throw SecurityException.validation("Compliance context missing ID");
     }
  }
}
