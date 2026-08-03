import { DisasterContract } from './disaster.contract';
import { ContinuityException } from '../exceptions/continuity.exception';

export class DisasterValidator {
  static validate(scenario: DisasterContract): void {
     if (!scenario.scenario_id || !scenario.category || !scenario.mitigation_status) {
        throw ContinuityException.validation("Disaster scenario missing required properties");
     }
  }
}
