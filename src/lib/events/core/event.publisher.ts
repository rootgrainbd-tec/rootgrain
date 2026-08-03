import { DomainEventContract } from '../contracts/event.contract';
import { PublisherContract } from '../contracts/publisher.contract';
import { EventDispatcher } from './event.dispatcher';
import { EventValidator } from '../validators/event.validator';
import { EventContext, EventState } from './event.context';
import { EventLifecycle } from './event.lifecycle';
import { EventException } from '../exceptions/event.exception';

export class EventPublisher implements PublisherContract {
  async publish(event: DomainEventContract): Promise<void> {
    let context: EventContext = { eventId: event.id, state: EventState.CREATED, timestamp: Date.now() };

    try {
      EventValidator.validateContract(event);
      context = EventLifecycle.transition(context, EventState.VALIDATED);

      await EventDispatcher.dispatch(event);
      context = EventLifecycle.transition(context, EventState.DISPATCHED);

    } catch (e: any) {
      context = EventLifecycle.transition(context, EventState.FAILED, e.message);
      throw EventException.dispatch(`Publishing failed: ${e.message}`, { eventId: event.id, originalError: e.message });
    }
  }

  async dispatch(events: DomainEventContract[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
