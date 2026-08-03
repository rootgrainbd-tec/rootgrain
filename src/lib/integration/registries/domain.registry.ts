import { DomainContract } from '../contracts/domain-contract';
import { IntegrationException } from '../exceptions/integration.exception';

export class DomainRegistry {
  private static domains: Map<string, DomainContract> = new Map();

  static register(domain: DomainContract): void {
    if (this.domains.has(domain.identifier)) {
      throw new IntegrationException(`Domain ${domain.identifier} is already registered`, 'DUPLICATE_DOMAIN');
    }
    this.domains.set(domain.identifier, domain);
  }

  static getDomain(identifier: string): DomainContract {
    const domain = this.domains.get(identifier);
    if (!domain) {
      throw new IntegrationException(`Domain ${identifier} is not registered`, 'DOMAIN_NOT_FOUND');
    }
    return domain;
  }
}
