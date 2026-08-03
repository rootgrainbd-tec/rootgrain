import { DomainEventContract } from '../contracts/event.contract';

export interface OrderCreatedPayload {
  orderId: string;
  customerId: string;
  total: number;
}

export type OrderCreatedEvent = DomainEventContract<OrderCreatedPayload>;

export interface OrderFulfilledPayload {
  orderId: string;
  fulfillmentDate: number;
}

export type OrderFulfilledEvent = DomainEventContract<OrderFulfilledPayload>;
