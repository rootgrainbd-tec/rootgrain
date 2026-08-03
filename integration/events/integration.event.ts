export interface IntegrationEvent {
  readonly event_id: string;
  readonly event_type: string;
  readonly source: string;
  readonly target: string;
  readonly payload_schema: string;
  readonly compatibility_version: string;
}
