import { IdentityContract } from '../contracts/identity.contract';
import { IdentityException } from '../exceptions/identity.exception';

export class IdentityValidator {
  static validate(contract: IdentityContract): void {
     if (!contract.identity_id || !contract.governance_status) {
        throw IdentityException.validation("Identity contract missing properties");
     }
  }
}
