import { Fulfillment, FulfillmentItem } from '../types/fulfillment';
import { VALID_FULFILLMENT_STATES } from '../constants/fulfillment.constants';
import { FulfillmentException } from '../exceptions/fulfillment.exception';

export class FulfillmentValidator {
  static validateItem(item: Partial<FulfillmentItem>): FulfillmentItem {
    const errors: Record<string, string[]> = {};

    if (!item.order_item_id || typeof item.order_item_id !== 'string') {
      errors['order_item_id'] = ['Required and must be a string'];
    }
    
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors['quantity'] = ['Must be a positive number greater than 0'];
    }

    if (Object.keys(errors).length > 0) {
      throw new FulfillmentException('Invalid fulfillment item data', errors);
    }

    return Object.freeze({ ...item }) as FulfillmentItem;
  }

  static validate(fulfillment: Partial<Fulfillment>): Fulfillment {
    const errors: Record<string, string[]> = {};

    if (!fulfillment.id || typeof fulfillment.id !== 'string') errors['id'] = ['Required'];
    if (!fulfillment.order_id || typeof fulfillment.order_id !== 'string') errors['order_id'] = ['Required'];
    
    if (!fulfillment.status || !VALID_FULFILLMENT_STATES.includes(fulfillment.status)) {
      errors['status'] = [`Must be a valid status: ${VALID_FULFILLMENT_STATES.join(', ')}`];
    }

    if (Object.keys(errors).length > 0) {
      throw new FulfillmentException('Invalid fulfillment base properties', errors);
    }

    return Object.freeze({ ...fulfillment }) as Fulfillment;
  }
}
