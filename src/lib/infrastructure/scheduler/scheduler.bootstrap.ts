import { ProviderRegistry } from '../providers/provider.registry';
import { ProviderCategory } from '../contracts/provider.contract';

export class SchedulerBootstrap {
  static register(): void {
    ProviderRegistry.register({
       id: 'scheduler_provider_production',
       category: ProviderCategory.SCHEDULER,
       metadata: Object.freeze({ type: 'local_scheduler' })
    });
  }
}
