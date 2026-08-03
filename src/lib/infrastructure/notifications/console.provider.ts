import { NotificationAdapter } from '../adapters/notification.adapter';

export class ConsoleNotificationProvider extends NotificationAdapter {
  override readonly adapter_id = 'console_notification';
  
  async initialize(): Promise<void> {
    await super.initialize();
  }

  async start(): Promise<void> {
    await super.start();
  }

  async stop(): Promise<void> {
    await super.stop();
  }
}
