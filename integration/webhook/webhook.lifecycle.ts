import { WebhookContract, WebhookStatus } from './webhook.contract';

export class WebhookLifecycle {
  static transition(contract: WebhookContract, newStatus: WebhookStatus): WebhookContract {
     return { ...contract, status: newStatus };
  }
}
