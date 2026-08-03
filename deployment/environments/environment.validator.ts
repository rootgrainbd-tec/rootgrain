import { EnvironmentRegistryEntry } from './environment.registry';

export class EnvironmentValidator {
  static validate(entry: EnvironmentRegistryEntry): void {
     if (!entry.environment_id || !entry.environment_type) {
        throw new Error("Environment missing required identifiers");
     }
  }
}
