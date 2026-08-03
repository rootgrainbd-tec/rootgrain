import { ResourceProfile } from './resource.profile';
import { EfficiencyPolicy } from './efficiency.policy';
import { PerformanceException } from '../exceptions/performance.exception';

export class UtilizationValidator {
  static validate(profile: ResourceProfile, policy: EfficiencyPolicy): void {
     for (const [key, limit] of Object.entries(policy.targets)) {
        if (profile.allocations[key] !== undefined && profile.allocations[key] > limit) {
           throw PerformanceException.failClosed(`Resource ${key} allocation exceeds efficiency bounds`);
        }
     }
  }
}
