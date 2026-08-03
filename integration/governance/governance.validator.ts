import { IntegrationPolicy } from './integration.policy';
import { CommunicationPolicy } from './communication.policy';

export class GovernanceValidator {
  static validateIntegrationPolicy(policy: IntegrationPolicy): void {}
  static validateCommunicationPolicy(policy: CommunicationPolicy): void {}
}
