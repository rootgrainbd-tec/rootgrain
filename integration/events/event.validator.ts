import { IntegrationEvent } from './integration.event';
import { IntegrationException } from '../exceptions/integration.exception';

export class EventValidator {
  static validate(event: IntegrationEvent): void {
     if (!event.event_id || !event.event_type || !event.source || !event.target) {
        throw IntegrationException.validation("Event missing routing identifiers");
     }
  }
}
