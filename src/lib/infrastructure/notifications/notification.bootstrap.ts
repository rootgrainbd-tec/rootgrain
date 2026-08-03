import { ProviderRegistry } from '../providers/provider.registry';
import { ProviderCategory } from '../contracts/provider.contract';

export class NotificationBootstrap {
  static register(): void {
    ProviderRegistry.register({
       id: 'smtp_notification_provider',
       category: ProviderCategory.NOTIFICATION,
       metadata: Object.freeze({ type: 'smtp_production' })
    });
  }
}
