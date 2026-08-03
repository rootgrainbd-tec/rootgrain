import { GovernanceContext } from '../governance/governance.context';
import { DataException } from '../exceptions/data.exception';

export class GovernanceValidator {
  static validate(context: GovernanceContext): void {
     if (!context.governance_id || !context.data_owner || !context.data_scope) {
        throw DataException.validation("Governance context missing required identifiers");
     }
  }
}
