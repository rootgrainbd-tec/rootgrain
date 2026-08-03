import { ServiceOwner } from './service.owner';
import { ServiceException } from '../exceptions/service.exception';

export class OwnershipValidator {
  static validate(owner: ServiceOwner): void {
     if (!owner.primary_owner || !owner.backup_owner) {
        throw ServiceException.validation("Service owner missing primary or backup assignments");
     }
  }
}
