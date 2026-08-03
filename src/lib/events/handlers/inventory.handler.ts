import { HandlerContract } from '../contracts/handler.contract';
import { InventoryReceivedEvent, InventoryAllocatedEvent, InventoryAdjustedEvent } from '../schemas/inventory.events';
import { PayloadValidator } from '../validators/payload.validator';

export class InventoryReceivedHandler implements HandlerContract<InventoryReceivedEvent> {
  readonly supportedEventType = 'inventory_received';
  async handle(event: InventoryReceivedEvent): Promise<void> {}
  validate(event: InventoryReceivedEvent): boolean { return true; }
}

export class InventoryAllocatedHandler implements HandlerContract<InventoryAllocatedEvent> {
  readonly supportedEventType = 'inventory_allocated';
  async handle(event: InventoryAllocatedEvent): Promise<void> {}
  validate(event: InventoryAllocatedEvent): boolean { return true; }
}

export class InventoryAdjustedHandler implements HandlerContract<InventoryAdjustedEvent> {
  readonly supportedEventType = 'inventory_adjusted';
  async handle(event: InventoryAdjustedEvent): Promise<void> {}
  validate(event: InventoryAdjustedEvent): boolean { return true; }
}
