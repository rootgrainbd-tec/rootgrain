import { ApiContract } from '../api/api.contract';
import { PartnerContract } from '../ecosystem/partner.contract';
import { WebhookContract } from '../webhook/webhook.contract';
import { IntegrationEvent } from '../events/integration.event';
import { IntegrationException } from '../exceptions/integration.exception';

export class IntegrationRegistry {
  private static apis = new Map<string, ApiContract>();
  private static partners = new Map<string, PartnerContract>();
  private static webhooks = new Map<string, WebhookContract>();
  private static events = new Map<string, IntegrationEvent>();

  static registerApi(contract: ApiContract): void {
     if (this.apis.has(contract.api_id)) throw IntegrationException.validation("Duplicate API ID");
     this.apis.set(contract.api_id, contract);
  }

  static registerPartner(contract: PartnerContract): void {
     if (this.partners.has(contract.partner_id)) throw IntegrationException.validation("Duplicate Partner ID");
     this.partners.set(contract.partner_id, contract);
  }

  static registerWebhook(contract: WebhookContract): void {
     if (this.webhooks.has(contract.webhook_id)) throw IntegrationException.validation("Duplicate Webhook ID");
     this.webhooks.set(contract.webhook_id, contract);
  }

  static registerEvent(contract: IntegrationEvent): void {
     if (this.events.has(contract.event_id)) throw IntegrationException.validation("Duplicate Event ID");
     this.events.set(contract.event_id, contract);
  }
}
