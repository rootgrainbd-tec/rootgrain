import { EnvironmentValidator } from './environment.validator';

export class ProductionConfig {
  static validate(): void {
     EnvironmentValidator.validate([
        'REDIS_URL',
        'SMTP_HOST',
        'DATABASE_URL',
        'OTEL_EXPORTER_OTLP_ENDPOINT'
     ]);
  }
}
