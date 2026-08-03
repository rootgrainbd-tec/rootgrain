import { ServiceContract } from '../contracts/service.contract';
import { ServiceException } from '../exceptions/service.exception';

export class ServiceValidator {
  static validate(contract: ServiceContract): void {
     if (!contract.service_id || !contract.lifecycle_status) {
        throw ServiceException.validation("Service contract missing properties");
     }
  }
}
