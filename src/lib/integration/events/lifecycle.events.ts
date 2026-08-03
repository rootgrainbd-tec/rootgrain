import { EventContract } from '../contracts/event-contract';
import { DOMAIN_EVENTS } from './domain.events';
import { randomUUID } from 'crypto';

export class LifecycleEvents {
  static createEvent(type: string, source: string, payload: Record<string, unknown>): EventContract {
    return Object.freeze({
      event_id: randomUUID(),
      event_type: type,
      source_domain: source,
      timestamp: new Date(),
      payload: Object.freeze({ ...payload })
    });
  }
}
