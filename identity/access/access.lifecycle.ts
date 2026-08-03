import { AccessContract, ApprovalStatus } from '../contracts/access.contract';
import { IdentityException } from '../exceptions/identity.exception';

export class AccessLifecycle {
  static transition(contract: AccessContract, newStatus: ApprovalStatus): AccessContract {
     if (contract.approval_status === 'EXPIRED') {
        throw IdentityException.failClosed("Expired access requests cannot transition states");
     }
     return { ...contract, approval_status: newStatus };
  }
}
