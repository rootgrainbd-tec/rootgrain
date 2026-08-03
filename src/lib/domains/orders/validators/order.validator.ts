import { Order, OrderFulfillmentInfo } from '../types/order';
import { VALID_ORDER_STATES, VALID_ORDER_TYPES } from '../constants/order.constants';
import { OrderException } from '../exceptions/order.exception';

export class OrderValidator {
  static validateFulfillmentInfo(info: Partial<OrderFulfillmentInfo>): OrderFulfillmentInfo {
    const errors: Record<string, string[]> = {};

    if (typeof info.fulfilled_quantity !== 'number' || info.fulfilled_quantity < 0) {
      errors['fulfilled_quantity'] = ['Must be a non-negative number'];
    }
    if (typeof info.pending_quantity !== 'number' || info.pending_quantity < 0) {
      errors['pending_quantity'] = ['Must be a non-negative number'];
    }
    if (typeof info.cancelled_quantity !== 'number' || info.cancelled_quantity < 0) {
      errors['cancelled_quantity'] = ['Must be a non-negative number'];
    }

    if (Object.keys(errors).length > 0) {
      throw new OrderException('Invalid order fulfillment info data', 'INVALID_FULFILLMENT_INFO');
    }

    return Object.freeze({ ...info }) as OrderFulfillmentInfo;
  }

  static validateOrder(order: Partial<Order>): Order {
    const errors: Record<string, string[]> = {};

    if (!order.id || typeof order.id !== 'string') errors['id'] = ['Required'];
    if (!order.order_number || typeof order.order_number !== 'string') errors['order_number'] = ['Required'];
    if (!order.customer_id || typeof order.customer_id !== 'string') errors['customer_id'] = ['Required'];

    if (!order.status || !VALID_ORDER_STATES.includes(order.status)) {
      errors['status'] = [`Must be a valid status: ${VALID_ORDER_STATES.join(', ')}`];
    }
    
    if (!order.type || !VALID_ORDER_TYPES.includes(order.type)) {
      errors['type'] = [`Must be a valid order type: ${VALID_ORDER_TYPES.join(', ')}`];
    }

    // Mathematical integrity logic check
    const computedTotal = (order.subtotal || 0) - (order.discount || 0) + (order.tax || 0);
    if (typeof order.total === 'number' && Math.abs(order.total - computedTotal) > 0.01) {
      errors['total'] = [`Total (${order.total}) does not match subtotal - discount + tax (${computedTotal})`];
    }

    if (Object.keys(errors).length > 0) {
      throw new OrderException('Invalid order base properties', 'INVALID_ORDER');
    }

    return Object.freeze({ ...order }) as Order;
  }
}
