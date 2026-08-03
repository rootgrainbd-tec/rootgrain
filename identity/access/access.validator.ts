import { AccessContract } from '../contracts/access.contract';
import { IdentityException } from '../exceptions/identity.exception';

export class AccessValidator {
  static validate(contract: AccessContract): void {
     if (!contract.request_id || !contract.identity_id) {
        throw IdentityException.validation("Access contract missing identifiers");
     }
  }
}
