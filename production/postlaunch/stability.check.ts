export interface StabilityCheck {
  readonly check_id: string;
  readonly release_id: string;
  readonly uptime_percentage: number;
  readonly active_incidents: number;
}
