import { AccessContract } from '../contracts/access.contract';
import { IdentityException } from '../exceptions/identity.exception';

export class AccessReview {
  static validate(contract: AccessContract): void {
     if (contract.approval_status === 'REJECTED') {
        throw IdentityException.failClosed("Rejected access cannot be reviewed for activation");
     }
  }
}
