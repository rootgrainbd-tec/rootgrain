import { ProviderContract } from '../contracts/provider.contract';
import { InfrastructureException } from '../exceptions/infrastructure.exception';

export class ProviderValidator {
  static validateMetadataImmutability(provider: ProviderContract): void {
     if (!Object.isFrozen(provider.metadata)) {
        throw InfrastructureException.validation('Provider metadata must be strictly immutable', { providerId: provider.id });
     }
  }
}
