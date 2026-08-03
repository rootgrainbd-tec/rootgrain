import { DomainEventContract } from './event.contract';

export interface HandlerContract<TEvent extends DomainEventContract = DomainEventContract> {
  readonly supportedEventType: string;
  handle(event: TEvent): Promise<void>;
  validate(event: TEvent): boolean;
}
