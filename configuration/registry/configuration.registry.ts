import { ConfigurationContract } from '../contracts/configuration.contract';
import { ChangeContract } from '../contracts/change.contract';
import { ConfigurationException } from '../exceptions/configuration.exception';

export class ConfigurationRegistry {
  private static configurations = new Map<string, ConfigurationContract>();
  private static changes = new Map<string, ChangeContract>();

  static registerConfiguration(contract: ConfigurationContract): void {
     if (this.configurations.has(contract.configuration_id)) throw ConfigurationException.validation("Duplicate Configuration ID");
     this.configurations.set(contract.configuration_id, contract);
  }

  static registerChange(contract: ChangeContract): void {
     if (this.changes.has(contract.change_id)) throw ConfigurationException.validation("Duplicate Change ID");
     this.changes.set(contract.change_id, contract);
  }
}
