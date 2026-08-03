import { HandlerContract } from '../contracts/handler.contract';
import { ProductionStartedEvent, ProductionCompletedEvent } from '../schemas/production.events';

export class ProductionStartedHandler implements HandlerContract<ProductionStartedEvent> {
  readonly supportedEventType = 'production_started';
  async handle(event: ProductionStartedEvent): Promise<void> {}
  validate(event: ProductionStartedEvent): boolean { return true; }
}

export class ProductionCompletedHandler implements HandlerContract<ProductionCompletedEvent> {
  readonly supportedEventType = 'production_completed';
  async handle(event: ProductionCompletedEvent): Promise<void> {}
  validate(event: ProductionCompletedEvent): boolean { return true; }
}
