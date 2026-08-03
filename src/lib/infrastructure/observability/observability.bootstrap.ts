import { ProviderRegistry } from '../providers/provider.registry';
import { ProviderCategory } from '../contracts/provider.contract';

export class ObservabilityBootstrap {
  static register(): void {
    ProviderRegistry.register({
       id: 'opentelemetry_provider',
       category: ProviderCategory.OBSERVABILITY,
       metadata: Object.freeze({ type: 'opentelemetry' })
    });
  }
}
