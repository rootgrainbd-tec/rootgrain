import { DomainEventContract } from '../contracts/event.contract';

export interface ProductionStartedPayload {
  productionId: string;
  startTime: number;
}

export type ProductionStartedEvent = DomainEventContract<ProductionStartedPayload>;

export interface ProductionCompletedPayload {
  productionId: string;
  endTime: number;
  outputQuantity: number;
}

export type ProductionCompletedEvent = DomainEventContract<ProductionCompletedPayload>;
