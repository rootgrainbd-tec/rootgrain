import { HandlerContract } from '../contracts/handler.contract';
import { OrderCreatedEvent, OrderFulfilledEvent } from '../schemas/order.events';

export class OrderCreatedHandler implements HandlerContract<OrderCreatedEvent> {
  readonly supportedEventType = 'order_created';
  async handle(event: OrderCreatedEvent): Promise<void> {}
  validate(event: OrderCreatedEvent): boolean { return true; }
}

export class OrderFulfilledHandler implements HandlerContract<OrderFulfilledEvent> {
  readonly supportedEventType = 'order_fulfilled';
  async handle(event: OrderFulfilledEvent): Promise<void> {}
  validate(event: OrderFulfilledEvent): boolean { return true; }
}
