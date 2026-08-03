export interface HealthValidation {
  readonly validation_id: string;
  readonly release_id: string;
  readonly metrics_healthy: boolean;
  readonly error_rates_normal: boolean;
}
