import { EventContract } from '../contracts/event-contract';
import { VALID_DOMAIN_EVENTS } from '../events/domain.events';
import { VALID_INTEGRATION_DOMAINS } from '../constants/integration.constants';
import { IntegrationException } from '../exceptions/integration.exception';

export class IntegrationValidator {
  static validateEvent(event: Partial<EventContract>): EventContract {
    const errors: string[] = [];

    if (!event.event_id) errors.push('event_id is required');
    if (!event.event_type || !VALID_DOMAIN_EVENTS.includes(event.event_type as any)) {
      errors.push(`Invalid event_type: ${event.event_type}`);
    }
    if (!event.source_domain || !VALID_INTEGRATION_DOMAINS.includes(event.source_domain as any)) {
      errors.push(`Invalid source_domain: ${event.source_domain}`);
    }
    if (!(event.timestamp instanceof Date)) errors.push('timestamp must be a valid Date object');
    if (!event.payload) errors.push('payload is required');

    if (errors.length > 0) {
      throw new IntegrationException(`Invalid event: ${errors.join(', ')}`, 'INVALID_EVENT');
    }

    return Object.freeze({ ...event }) as EventContract;
  }
}
