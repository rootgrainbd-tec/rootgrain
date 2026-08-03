import { ProviderRegistry } from './provider.registry';
import { ProviderFactory } from './provider.factory';
import { AdapterContract } from '../contracts/adapter.contract';
import { ProviderCategory } from '../contracts/provider.contract';

export class ProviderResolver {
  static resolve(category: ProviderCategory): AdapterContract {
     const provider = ProviderRegistry.getByCategory(category);
     return ProviderFactory.createAdapter(provider);
  }
}
