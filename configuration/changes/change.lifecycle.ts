import { ChangeContract, ChangeStatus } from '../contracts/change.contract';
import { ConfigurationException } from '../exceptions/configuration.exception';

export class ChangeLifecycle {
  static transition(contract: ChangeContract, newStatus: ChangeStatus): ChangeContract {
     if (contract.approval_status === 'COMPLETED' || contract.approval_status === 'REJECTED' || contract.approval_status === 'ROLLED_BACK') {
        throw ConfigurationException.failClosed("Terminal change requests cannot change status");
     }
     return { ...contract, approval_status: newStatus };
  }
}
