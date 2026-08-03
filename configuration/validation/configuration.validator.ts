import { ConfigurationContract } from '../contracts/configuration.contract';
import { ConfigurationException } from '../exceptions/configuration.exception';

export class ConfigurationValidator {
  static validate(contract: ConfigurationContract): void {
     if (!contract.configuration_id || !contract.lifecycle_status) {
        throw ConfigurationException.validation("Configuration contract missing properties");
     }
  }
}
