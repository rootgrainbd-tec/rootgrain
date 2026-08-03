import { IntegrationException } from '../exceptions/integration.exception';

export class ServiceRegistry {
  private static services: Map<string, unknown> = new Map();

  static register<T>(identifier: string, service: T): void {
    if (this.services.has(identifier)) {
      throw new IntegrationException(`Service ${identifier} is already registered`, 'DUPLICATE_SERVICE');
    }
    this.services.set(identifier, service);
  }

  static getService<T>(identifier: string): T {
    const service = this.services.get(identifier);
    if (!service) {
      throw new IntegrationException(`Service ${identifier} is not registered`, 'SERVICE_NOT_FOUND');
    }
    return service as T;
  }
}
