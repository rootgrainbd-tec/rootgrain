import { DomainIdentifier, INTEGRATION_DOMAINS } from '../constants/integration.constants';
import { IntegrationException } from '../exceptions/integration.exception';

export class DependencyValidator {
  // Linearity check: Ensure downstream doesn't call upstream
  static validateDependency(source: DomainIdentifier, target: DomainIdentifier): boolean {
    const order = [
      INTEGRATION_DOMAINS.RESOURCES,
      INTEGRATION_DOMAINS.INVENTORY,
      INTEGRATION_DOMAINS.PRODUCTION,
      INTEGRATION_DOMAINS.ORDERS,
      INTEGRATION_DOMAINS.ACCOUNTING,
      INTEGRATION_DOMAINS.REPORTING
    ];

    const sourceIndex = order.indexOf(source);
    const targetIndex = order.indexOf(target);

    if (sourceIndex === -1 || targetIndex === -1) {
      throw new IntegrationException('Unknown domain identifier', 'UNKNOWN_DOMAIN');
    }

    if (sourceIndex >= targetIndex) {
      throw new IntegrationException(`Domain ${source} cannot depend on ${target}. Linearity violation.`, 'LINEARITY_VIOLATION', source);
    }

    return true;
  }
}
