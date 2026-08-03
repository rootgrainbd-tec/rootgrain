import { RoleContract } from '../contracts/role.contract';
import { IdentityException } from '../exceptions/identity.exception';

export class RoleValidator {
  static validate(role: RoleContract): void {
     if (!role.role_id || !role.role_name || !role.permission_scope) {
        throw IdentityException.validation("Role contract missing identifiers");
     }
  }
}
