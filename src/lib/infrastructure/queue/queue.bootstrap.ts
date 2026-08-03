import { ProviderRegistry } from '../providers/provider.registry';
import { ProviderCategory } from '../contracts/provider.contract';

export class QueueBootstrap {
  static register(): void {
    ProviderRegistry.register({
       id: 'redis_queue_provider',
       category: ProviderCategory.QUEUE,
       metadata: Object.freeze({ type: 'redis_production' })
    });
  }
}
