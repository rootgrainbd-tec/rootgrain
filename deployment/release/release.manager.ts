import { ReleaseContract } from './release.contract';

export class ReleaseManager {
  static validateRelease(release: ReleaseContract): void {
     if (!release.semantic_version || !release.deployment_target || !release.rollback_target) {
        throw new Error('Release Contract is missing mandatory targets or version identifiers');
     }
     if (!Object.isFrozen(release.metadata)) {
        throw new Error('Release metadata must be strictly immutable');
     }
  }
}
