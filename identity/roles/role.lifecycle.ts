import { RoleContract, RoleStatus } from '../contracts/role.contract';
import { IdentityException } from '../exceptions/identity.exception';

export class RoleLifecycle {
  static transition(role: RoleContract, newStatus: RoleStatus): RoleContract {
     if (role.lifecycle_status === 'RETIRED') {
        throw IdentityException.failClosed("Retired roles cannot change status");
     }
     return { ...role, lifecycle_status: newStatus };
  }
}
