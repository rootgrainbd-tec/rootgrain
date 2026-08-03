import { ObservabilityException } from '../exceptions/observability.exception';

export class RetentionPolicy {
  static enforceRetentionLimits(days: number): void {
     if (days < 0 || days > 3650) { // arbitrary safe limit
        throw ObservabilityException.validation('Invalid retention period limits', { days });
     }
  }
}
