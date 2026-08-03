import { DomainEventContract } from '../contracts/event.contract';

export interface InventoryReceivedPayload {
  inventoryId: string;
  quantity: number;
}

export type InventoryReceivedEvent = DomainEventContract<InventoryReceivedPayload>;

export interface InventoryAllocatedPayload {
  inventoryId: string;
  orderId: string;
  quantity: number;
}

export type InventoryAllocatedEvent = DomainEventContract<InventoryAllocatedPayload>;

export interface InventoryAdjustedPayload {
  inventoryId: string;
  reason: string;
  delta: number;
}

export type InventoryAdjustedEvent = DomainEventContract<InventoryAdjustedPayload>;
