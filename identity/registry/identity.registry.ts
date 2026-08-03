import { IdentityContract } from '../contracts/identity.contract';
import { RoleContract } from '../contracts/role.contract';
import { PermissionContract } from '../contracts/permission.contract';
import { IdentityException } from '../exceptions/identity.exception';

export class IdentityRegistry {
  private static identities = new Map<string, IdentityContract>();
  private static roles = new Map<string, RoleContract>();
  private static permissions = new Map<string, PermissionContract>();

  static registerIdentity(contract: IdentityContract): void {
     if (this.identities.has(contract.identity_id)) throw IdentityException.validation("Duplicate Identity ID");
     this.identities.set(contract.identity_id, contract);
  }

  static registerRole(contract: RoleContract): void {
     if (this.roles.has(contract.role_id)) throw IdentityException.validation("Duplicate Role ID");
     this.roles.set(contract.role_id, contract);
  }

  static registerPermission(contract: PermissionContract): void {
     if (this.permissions.has(contract.permission_id)) throw IdentityException.validation("Duplicate Permission ID");
     this.permissions.set(contract.permission_id, contract);
  }
}
