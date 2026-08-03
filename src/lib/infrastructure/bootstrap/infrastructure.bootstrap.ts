import { ProviderLoader } from './provider.loader';
import { ProviderCategory } from '../contracts/provider.contract';
import { ProviderResolver } from '../providers/provider.resolver';
import { StartupLifecycle } from '../lifecycle/startup.lifecycle';
import { InfrastructureHealth } from '../health/infrastructure.health';

export class InfrastructureBootstrap {
  static async start(configs: any[]): Promise<void> {
     // 1. Validation & 2. Registration
     ProviderLoader.loadAll(configs);

     const requiredCategories = [
        ProviderCategory.QUEUE,
        ProviderCategory.NOTIFICATION,
        ProviderCategory.EVENTS,
        ProviderCategory.SCHEDULER,
        ProviderCategory.OBSERVABILITY
     ];

     const adapters = [];

     for (const category of requiredCategories) {
        // Factory resolution
        const adapter = ProviderResolver.resolve(category);
        adapters.push(adapter);
        
        // 3. Provider initialization
        await StartupLifecycle.execute(adapter);
     }

     // 4 & 5. Health validation and readiness
     const isHealthy = await InfrastructureHealth.checkAll(adapters);
     if (!isHealthy) {
        throw new Error('Infrastructure bootstrap failed: providers are not healthy');
     }
  }
}
