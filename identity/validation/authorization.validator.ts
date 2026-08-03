import { IdentityContract } from '../contracts/identity.contract';
import { RoleContract } from '../contracts/role.contract';
import { PermissionContract } from '../contracts/permission.contract';
import { IdentityException } from '../exceptions/identity.exception';

export class AuthorizationValidator {
  static evaluate(identity: IdentityContract, role: RoleContract, permission: PermissionContract): void {
     if (identity.governance_status === 'RETIRED' || identity.governance_status === 'DEACTIVATED') {
        throw IdentityException.failClosed("Identity is no longer active");
     }
     if (role.lifecycle_status !== 'ACTIVE') {
        throw IdentityException.failClosed("Role is not active");
     }
     if (permission.status !== 'ACTIVE') {
        throw IdentityException.failClosed("Permission is not active");
     }
  }
}
