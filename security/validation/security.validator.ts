import { GovernanceContext } from '../governance/governance.context';
import { GovernanceValidator } from './governance.validator';

export class SecurityValidator {
  static validateContext(context: GovernanceContext): void {
     GovernanceValidator.validate(context);
  }
}
