import { RiskContract } from './risk.contract';

export class RiskAssessment {
  static assess(risk: RiskContract): boolean {
     // CRITICAL risks must be mitigated before they are considered safe
     if (risk.severity === 'CRITICAL' && risk.mitigation_status !== 'MITIGATED') {
        return false;
     }
     return true;
  }
}
