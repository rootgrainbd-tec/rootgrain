import { ReleaseContract, ReleaseStatus } from '../contracts/release.contract';
import { ConfigurationException } from '../exceptions/configuration.exception';

export class ReleaseLifecycle {
  static transition(contract: ReleaseContract, newStatus: ReleaseStatus): ReleaseContract {
     if (contract.release_status === 'RELEASED' || contract.release_status === 'FAILED' || contract.release_status === 'ROLLED_BACK') {
        throw ConfigurationException.failClosed("Terminal releases cannot change status");
     }
     return { ...contract, release_status: newStatus };
  }
}
