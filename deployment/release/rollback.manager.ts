import { ReleaseContract } from './release.contract';

export class RollbackManager {
  static calculateRollbackTarget(currentRelease: ReleaseContract): string {
     if (!currentRelease.rollback_target) {
        throw new Error(`Rollback target missing for release ${currentRelease.release_id}`);
     }
     return currentRelease.rollback_target;
  }
}
