import { ConfigurationOwner } from './configuration.owner';
import { ConfigurationException } from '../exceptions/configuration.exception';

export class OwnershipValidator {
  static validate(owner: ConfigurationOwner): void {
     if (!owner.owner_id || !owner.domain) {
        throw ConfigurationException.validation("Configuration owner missing identifiers");
     }
  }
}
