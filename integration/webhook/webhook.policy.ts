export interface WebhookPolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
