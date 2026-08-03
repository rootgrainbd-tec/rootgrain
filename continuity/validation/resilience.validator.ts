import { DisasterContract } from '../disaster/disaster.contract';
import { ContinuityException } from '../exceptions/continuity.exception';

export class ResilienceValidator {
  static validate(scenario: DisasterContract): void {
     if (scenario.impact_level === 'CRITICAL' && scenario.mitigation_status === 'OPEN') {
        throw ContinuityException.failClosed(`Critical disaster scenario ${scenario.scenario_id} must have a mitigation plan.`);
     }
  }
}
