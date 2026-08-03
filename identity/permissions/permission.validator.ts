import { PermissionContract } from '../contracts/permission.contract';
import { IdentityException } from '../exceptions/identity.exception';

export class PermissionValidator {
  static validate(contract: PermissionContract): void {
     if (!contract.permission_id || !contract.resource_scope || !contract.action_scope) {
        throw IdentityException.validation("Permission contract missing properties");
     }
  }
}
