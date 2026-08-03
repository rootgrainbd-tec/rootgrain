import { ChangeContract } from '../contracts/change.contract';
import { ConfigurationException } from '../exceptions/configuration.exception';

export class ChangeValidator {
  static validate(contract: ChangeContract): void {
     if (!contract.change_id || !contract.target_configuration) {
        throw ConfigurationException.validation("Change contract missing identifiers");
     }
  }
}
