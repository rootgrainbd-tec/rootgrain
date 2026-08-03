import { InventorySerializer } from '../../../lib/api/serializers/inventory.serializer';
import { InventoryResponseDto } from '../../../lib/api/dto/inventory.dto';

export class InventoryTransformer {
  static transformOutput(domainEntity: any): InventoryResponseDto {
    return InventorySerializer.serialize(domainEntity);
  }
}
