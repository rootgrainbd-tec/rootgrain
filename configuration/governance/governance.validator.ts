import { ConfigurationPolicy } from './configuration.policy';
import { EnvironmentPolicy } from './environment.policy';
import { ChangePolicy } from './change.policy';
import { ConfigurationException } from '../exceptions/configuration.exception';

export class GovernanceValidator {
  static validate(conf: ConfigurationPolicy, env: EnvironmentPolicy, change: ChangePolicy): void {
     if (!conf.policy_id || !env.policy_id || !change.policy_id) {
        throw ConfigurationException.validation("Governance policies missing identifiers");
     }
  }
}
