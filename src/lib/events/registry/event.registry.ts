import { HandlerContract } from '../contracts/handler.contract';
import { EventException } from '../exceptions/event.exception';

export class EventRegistry {
  private static handlers = new Map<string, Set<HandlerContract>>();

  static register(eventType: string, handler: HandlerContract): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    const handlers = this.handlers.get(eventType)!;
    if (handlers.has(handler)) {
      throw EventException.registry(`Handler is already registered for ${eventType}`);
    }
    handlers.add(handler);
  }

  static getHandlers(eventType: string): HandlerContract[] {
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.size === 0) {
      // Per fail-closed behavior, dispatching an event with no handler is a registry failure
      throw EventException.registry(`No handlers registered for event type ${eventType}`);
    }
    return Array.from(handlers);
  }
}
