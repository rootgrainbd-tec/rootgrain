import { EnvironmentContract } from '../contracts/environment.contract';
import { ConfigurationException } from '../exceptions/configuration.exception';

export class EnvironmentRegistry {
  private static environments = new Map<string, EnvironmentContract>();

  static register(contract: EnvironmentContract): void {
     if (this.environments.has(contract.environment_id)) {
        throw ConfigurationException.validation("Duplicate Environment ID");
     }
     this.environments.set(contract.environment_id, contract);
  }
}
