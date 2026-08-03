import { ServicePolicy } from './service.policy';
import { OwnershipPolicy } from './ownership.policy';
import { SupportPolicy } from './support.policy';
import { ServiceException } from '../exceptions/service.exception';

export class GovernanceValidator {
  static validate(sp: ServicePolicy, op: OwnershipPolicy, sup: SupportPolicy): void {
     if (!sp.policy_id || !op.policy_id || !sup.policy_id) {
        throw ServiceException.validation("Governance policies missing identifiers");
     }
  }
}
