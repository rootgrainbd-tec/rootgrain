import { WebhookContract } from './webhook.contract';
import { IntegrationException } from '../exceptions/integration.exception';

export class WebhookValidator {
  static validate(contract: WebhookContract): void {
     if (!contract.webhook_id || !contract.event_type || !contract.endpoint_scope) {
        throw IntegrationException.validation("Webhook missing identifiers");
     }
  }
}
