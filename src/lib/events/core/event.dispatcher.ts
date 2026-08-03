import { DomainEventContract } from '../contracts/event.contract';
import { EventRegistry } from '../registry/event.registry';
import { EventException } from '../exceptions/event.exception';

export class EventDispatcher {
  private static dispatchedIds = new Set<string>();

  static async dispatch(event: DomainEventContract): Promise<void> {
    // Duplicate prevention contract
    if (this.dispatchedIds.has(event.id)) {
      throw EventException.dispatch('Duplicate event detected', { eventId: event.id });
    }
    
    const handlers = EventRegistry.getHandlers(event.type);
    
    for (const handler of handlers) {
      if (!handler.validate(event)) {
         throw EventException.handler(`Handler validation failed for ${event.type}`);
      }
      try {
         await handler.handle(event);
      } catch (e: any) {
         throw EventException.handler(`Handler failed: ${e.message}`);
      }
    }
    
    this.dispatchedIds.add(event.id);
  }

  // Internal test reset util
  static __reset(): void {
    this.dispatchedIds.clear();
  }
}
