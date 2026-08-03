import { OrderSerializer } from '../../../lib/api/serializers/order.serializer';
import { OrderResponseDto } from '../../../lib/api/dto/order.dto';

export class OrderTransformer {
  static transformOutput(domainEntity: any): OrderResponseDto {
    return OrderSerializer.serialize(domainEntity);
  }
}
