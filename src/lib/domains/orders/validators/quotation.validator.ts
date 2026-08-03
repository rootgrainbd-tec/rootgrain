import { Quotation } from '../types/quotation';
import { VALID_ORDER_STATES } from '../constants/order.constants';
import { OrderException } from '../exceptions/order.exception';

export class QuotationValidator {
  static validate(quotation: Partial<Quotation>): Quotation {
    const errors: Record<string, string[]> = {};

    if (!quotation.id || typeof quotation.id !== 'string') errors['id'] = ['Required'];
    if (!quotation.quotation_number || typeof quotation.quotation_number !== 'string') errors['quotation_number'] = ['Required'];
    if (!quotation.customer_id || typeof quotation.customer_id !== 'string') errors['customer_id'] = ['Required'];
    
    if (!quotation.status || !VALID_ORDER_STATES.includes(quotation.status)) {
      errors['status'] = [`Must be a valid status: ${VALID_ORDER_STATES.join(', ')}`];
    }

    if (!(quotation.valid_until instanceof Date)) {
      errors['valid_until'] = ['Required and must be a valid Date object'];
    }

    if (Object.keys(errors).length > 0) {
      throw new OrderException('Invalid quotation data', 'INVALID_QUOTATION');
    }

    return Object.freeze({ ...quotation }) as Quotation;
  }
}
