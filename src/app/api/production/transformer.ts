import { ProductionSerializer } from '../../../lib/api/serializers/production.serializer';
import { ProductionResponseDto } from '../../../lib/api/dto/production.dto';

export class ProductionTransformer {
  static transformOutput(domainEntity: any): ProductionResponseDto {
    return ProductionSerializer.serialize(domainEntity);
  }
}
