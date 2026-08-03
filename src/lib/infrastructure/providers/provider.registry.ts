import { ProviderContract, ProviderCategory } from '../contracts/provider.contract';
import { InfrastructureException } from '../exceptions/infrastructure.exception';
import { ProviderValidator } from '../validation/provider.validator';

export class ProviderRegistry {
  private static providers = new Map<string, ProviderContract>();
  private static categories = new Map<ProviderCategory, string>();

  static register(provider: ProviderContract): void {
    if (this.providers.has(provider.id)) {
      throw InfrastructureException.registry(`Provider ID ${provider.id} is already registered.`);
    }
    if (this.categories.has(provider.category)) {
      throw InfrastructureException.registry(`Category ${provider.category} already has a registered provider.`);
    }

    ProviderValidator.validateMetadataImmutability(provider);
    
    this.providers.set(provider.id, provider);
    this.categories.set(provider.category, provider.id);
  }

  static get(id: string): ProviderContract {
    const p = this.providers.get(id);
    if (!p) throw InfrastructureException.registry(`Provider ${id} not found.`);
    return p;
  }

  static getByCategory(category: ProviderCategory): ProviderContract {
    const id = this.categories.get(category);
    if (!id) throw InfrastructureException.registry(`No provider registered for category ${category}.`);
    return this.get(id);
  }
}
