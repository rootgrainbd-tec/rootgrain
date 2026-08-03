import { EnvironmentContract } from '../contracts/environment.contract';
import { ConfigurationException } from '../exceptions/configuration.exception';

export class EnvironmentValidator {
  static validate(contract: EnvironmentContract): void {
     if (!contract.environment_id || !contract.environment_type) {
        throw ConfigurationException.validation("Environment missing core identifiers");
     }
  }
}
