import { ProviderRegistry } from '../providers/provider.registry';
import { ProviderCategory } from '../contracts/provider.contract';

export class EventBootstrap {
  static register(): void {
    ProviderRegistry.register({
       id: 'redis_stream_event_provider',
       category: ProviderCategory.EVENTS,
       metadata: Object.freeze({ type: 'redis_stream' })
    });
  }
}
