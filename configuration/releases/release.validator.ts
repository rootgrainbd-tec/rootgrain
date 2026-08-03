import { ReleaseContract } from '../contracts/release.contract';
import { ConfigurationException } from '../exceptions/configuration.exception';

export class ReleaseValidator {
  static validate(contract: ReleaseContract): void {
     if (!contract.release_id || !contract.version) {
        throw ConfigurationException.validation("Release missing core identifiers");
     }
  }
}
