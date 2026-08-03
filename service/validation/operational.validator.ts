import { SupportContract } from '../contracts/support.contract';
import { ServiceException } from '../exceptions/service.exception';

export class OperationalValidator {
  static validate(contract: SupportContract): void {
     if (!contract.support_id || !contract.service_id) {
        throw ServiceException.validation("Operational support request missing linkage");
     }
  }
}
