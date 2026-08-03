import { HealthStatus } from './health.signal';

export interface MonitoringContext {
  readonly monitoring_id: string;
  readonly environment: string;
  readonly service_name: string;
  readonly timestamp: number;
  readonly health_status: HealthStatus;
}
