import { ApiVersion } from '../api/api.version';
import { IntegrationEvent } from '../events/integration.event';
import { IntegrationException } from '../exceptions/integration.exception';

export class CompatibilityValidator {
  static validateApi(version: ApiVersion): void {
     if (version.compatibility_status === 'BREAKING') {
        throw IntegrationException.failClosed("API version introduces breaking changes");
     }
  }

  static validateEvent(event: IntegrationEvent, expectedVersion: string): void {
     if (event.compatibility_version !== expectedVersion) {
        throw IntegrationException.failClosed("Event schema version mismatch");
     }
  }
}
