import { DomainEventContract } from '../contracts/event.contract';
import { EventException } from '../exceptions/event.exception';

export class EventValidator {
  static validateContract(event: any): void {
    if (!event || typeof event !== 'object') {
      throw EventException.validation('Event must be a valid object');
    }
    const required = ['id', 'type', 'aggregate_id', 'aggregate_type', 'payload', 'metadata', 'created_at'];
    const missing = required.filter(f => !(f in event));
    if (missing.length > 0) {
      throw EventException.validation('Event is missing required fields', { missing });
    }
    if (!Object.isFrozen(event.payload)) {
      throw EventException.validation('Event payload must be deeply frozen');
    }
  }
}
