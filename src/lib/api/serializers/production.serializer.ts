import { ProductionResponseDto } from '../dto/production.dto';

export class ProductionSerializer {
  static serialize(domainEntity: any): ProductionResponseDto {
    return Object.freeze({
      id: domainEntity.id,
      batch_id: domainEntity.batch_id,
      inventory_id: domainEntity.inventory_id,
      status: domainEntity.status,
      quality_status: domainEntity.quality_status,
      target_quantity: domainEntity.target_quantity,
      completed_quantity: domainEntity.completed_quantity
    });
  }
}
