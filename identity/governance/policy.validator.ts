import { IdentityPolicy } from './identity.policy';
import { AccessPolicy } from './access.policy';
import { IdentityException } from '../exceptions/identity.exception';

export class PolicyValidator {
  static validateIdentityPolicy(policy: IdentityPolicy): void {
     if (!policy.policy_id) throw IdentityException.validation("Identity policy missing identifiers");
  }
  static validateAccessPolicy(policy: AccessPolicy): void {
     if (!policy.policy_id) throw IdentityException.validation("Access policy missing identifiers");
  }
}
