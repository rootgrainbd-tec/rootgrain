export type WebhookStatus = 'CREATED' | 'VALIDATED' | 'ACTIVE' | 'SUSPENDED' | 'RETIRED';

export interface WebhookContract {
  readonly webhook_id: string;
  readonly event_type: string;
  readonly endpoint_scope: string;
  readonly delivery_policy: string;
  readonly status: WebhookStatus;
}
