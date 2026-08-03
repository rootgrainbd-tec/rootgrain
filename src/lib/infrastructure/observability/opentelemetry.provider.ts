import { ObservabilityAdapter } from '../adapters/observability.adapter';
import { SecretsConfig } from '../configuration/secrets.config';

export class OpenTelemetryProvider extends ObservabilityAdapter {
  override readonly adapter_id = 'opentelemetry_production';
  
  async initialize(): Promise<void> {
    await super.initialize();
  }

  async start(): Promise<void> { await super.start(); }
  async stop(): Promise<void> { await super.stop(); }
  async reconnect(): Promise<void> { await this.stop(); await this.start(); }
}
