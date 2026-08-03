import { ReleaseContract } from '../release/release.contract';

export class ReleaseLoader {
  static loadCurrentRelease(): ReleaseContract {
    return {
      release_id: 'rel-1',
      semantic_version: '1.0.0',
      deployment_target: 'production-cluster',
      rollback_target: 'rel-0',
      metadata: Object.freeze({})
    };
  }
}
