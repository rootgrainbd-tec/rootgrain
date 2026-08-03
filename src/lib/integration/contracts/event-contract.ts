export interface EventContract {
  event_id: string;
  event_type: string;
  source_domain: string;
  timestamp: Date;
  payload: Readonly<Record<string, unknown>>;
}
