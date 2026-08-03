import { DomainEventContract } from './event.contract';

export interface PublisherContract {
  publish(event: DomainEventContract): Promise<void>;
  dispatch(events: DomainEventContract[]): Promise<void>;
}
