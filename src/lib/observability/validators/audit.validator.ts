import { ObservabilityException } from '../exceptions/observability.exception';

export class AuditValidator {
  static validate(event: any): void {
    if (!event || typeof event !== 'object') {
      throw ObservabilityException.validation('Audit event must be an object');
    }
    const required = ['id', 'type', 'actor', 'action', 'resource', 'metadata', 'timestamp'];
    const missing = required.filter(f => !(f in event));
    if (missing.length > 0) {
       throw ObservabilityException.validation('Audit event missing required fields', { missing });
    }
    if (!Object.isFrozen(event.metadata)) {
       throw ObservabilityException.validation('Audit event metadata must be deeply frozen');
    }
  }
}
