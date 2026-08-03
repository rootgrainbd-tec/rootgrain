import { ServiceContract, ServiceStatus } from '../contracts/service.contract';
import { ServiceException } from '../exceptions/service.exception';

export class ServiceLifecycle {
  static transition(contract: ServiceContract, newStatus: ServiceStatus): ServiceContract {
     if (contract.lifecycle_status === 'RETIRED') {
        throw ServiceException.failClosed("Retired services cannot change status");
     }
     return { ...contract, lifecycle_status: newStatus };
  }
}
