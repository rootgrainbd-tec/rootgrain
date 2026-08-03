export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export interface HealthSignal {
  readonly component_id: string;
  readonly status: HealthStatus;
  readonly timestamp: number;
  readonly message?: string;
}
