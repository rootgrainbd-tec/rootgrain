import { InventoryResponseDto } from '../dto/inventory.dto';

export class InventorySerializer {
  static serialize(domainEntity: any): InventoryResponseDto {
    return Object.freeze({
      id: domainEntity.id,
      resource_id: domainEntity.resource_id,
      location_id: domainEntity.location_id,
      quantity: domainEntity.quantity,
      reserved_quantity: domainEntity.reserved_quantity,
      // Derived explicitly for API presentation
      available_quantity: domainEntity.quantity - (domainEntity.reserved_quantity || 0) - (domainEntity.allocated_quantity || 0),
      status: domainEntity.status
    });
  }
}
