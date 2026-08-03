import { SlaContract } from '../contracts/sla.contract';
import { ServiceException } from '../exceptions/service.exception';

export class SlaValidator {
  static validate(contract: SlaContract): void {
     if (!contract.sla_id || !contract.response_target || !contract.resolution_target) {
        throw ServiceException.validation("SLA contract missing target definitions");
     }
  }
}
