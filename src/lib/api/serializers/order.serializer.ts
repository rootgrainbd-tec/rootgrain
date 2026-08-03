import { OrderResponseDto } from '../dto/order.dto';

export class OrderSerializer {
  static serialize(domainEntity: any): OrderResponseDto {
    return Object.freeze({
      id: domainEntity.id,
      order_number: domainEntity.order_number,
      customer_id: domainEntity.customer_id,
      status: domainEntity.status,
      total: domainEntity.total
    });
  }
}
