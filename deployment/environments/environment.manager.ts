import { EnvironmentRegistry, EnvironmentRegistryEntry } from './environment.registry';
import { EnvironmentValidator } from './environment.validator';

export class EnvironmentManager {
  static setup(entries: EnvironmentRegistryEntry[]): void {
     entries.forEach(entry => {
        EnvironmentValidator.validate(entry);
        EnvironmentRegistry.register(entry);
     });
  }
}
