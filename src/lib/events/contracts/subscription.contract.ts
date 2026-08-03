import { HandlerContract } from './handler.contract';

export interface SubscriptionContract {
  subscribe(eventType: string, handler: HandlerContract): void;
  unsubscribe(eventType: string, handler: HandlerContract): void;
}
