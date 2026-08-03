import { GovernanceContext } from '../governance/governance.context';
import { SecurityException } from '../exceptions/security.exception';

export class GovernanceValidator {
  static validate(context: GovernanceContext): void {
     if (!context.context_id || !context.contract) {
        throw SecurityException.validation("Governance context missing identifiers");
     }
     if (context.contract.status !== 'ACTIVE') {
        throw SecurityException.validation("Governance contract is not active");
     }
  }
}
