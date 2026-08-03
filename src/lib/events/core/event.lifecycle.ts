import { EventContext, EventState } from './event.context';
import { EventException } from '../exceptions/event.exception';

export class EventLifecycle {
  static transition(context: EventContext, newState: EventState, error?: string): EventContext {
    const validTransitions: Record<EventState, EventState[]> = {
      [EventState.CREATED]: [EventState.VALIDATED, EventState.FAILED],
      [EventState.VALIDATED]: [EventState.DISPATCHED, EventState.FAILED],
      [EventState.DISPATCHED]: [EventState.HANDLED, EventState.FAILED],
      [EventState.HANDLED]: [],
      [EventState.FAILED]: []
    };

    if (!validTransitions[context.state].includes(newState)) {
      throw EventException.lifecycle(`Invalid transition from ${context.state} to ${newState}`, { eventId: context.eventId });
    }

    return Object.freeze({
      ...context,
      state: newState,
      error,
      timestamp: Date.now()
    });
  }
}
