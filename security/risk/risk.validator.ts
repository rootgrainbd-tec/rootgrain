import { RiskContract } from './risk.contract';
import { SecurityException } from '../exceptions/security.exception';

export class RiskValidator {
  static validate(risk: RiskContract): void {
     if (!risk.risk_id || !risk.severity || !risk.mitigation_status) {
        throw SecurityException.validation("Risk contract is missing required identifiers");
     }
  }
}
