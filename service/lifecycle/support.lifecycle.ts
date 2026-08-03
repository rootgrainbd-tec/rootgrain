import { SupportContract, SupportStatus } from '../contracts/support.contract';
import { ServiceException } from '../exceptions/service.exception';

export class SupportLifecycle {
  static transition(contract: SupportContract, newStatus: SupportStatus): SupportContract {
     if (contract.lifecycle_status === 'CLOSED' || contract.lifecycle_status === 'RESOLVED') {
        throw ServiceException.failClosed("Terminal support requests cannot change status");
     }
     return { ...contract, lifecycle_status: newStatus };
  }
}
