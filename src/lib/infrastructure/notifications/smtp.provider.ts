import { NotificationAdapter } from '../adapters/notification.adapter';
import { SecretsConfig } from '../configuration/secrets.config';

export class SmtpProvider extends NotificationAdapter {
  override readonly adapter_id = 'smtp_notification_production';
  
  async initialize(): Promise<void> {
    await super.initialize();
    // Validate secret exists during init
    SecretsConfig.get('SMTP_PASSWORD');
  }

  async start(): Promise<void> { await super.start(); }
  async stop(): Promise<void> { await super.stop(); }
  async reconnect(): Promise<void> { await this.stop(); await this.start(); }
}
