import { Payment } from '../types/payment';
import { VALID_PAYMENT_TYPES } from '../constants/accounting.constants';
import { AccountingException } from '../exceptions/accounting.exception';

export class AccountingValidator {
  static validatePayment(payment: Partial<Payment>): Payment {
    const errors: Record<string, string[]> = {};

    if (!payment.id || typeof payment.id !== 'string') errors['id'] = ['Required'];
    if (!payment.invoice_id || typeof payment.invoice_id !== 'string') errors['invoice_id'] = ['Required'];
    
    if (!payment.payment_type || !VALID_PAYMENT_TYPES.includes(payment.payment_type)) {
      errors['payment_type'] = [`Must be a valid payment type: ${VALID_PAYMENT_TYPES.join(', ')}`];
    }
    
    if (typeof payment.amount !== 'number' || payment.amount <= 0) {
      errors['amount'] = ['Must be a positive number greater than 0'];
    }

    if (!(payment.payment_date instanceof Date)) {
      errors['payment_date'] = ['Required and must be a valid Date object'];
    }

    if (Object.keys(errors).length > 0) {
      throw new AccountingException('Invalid payment data', 'INVALID_PAYMENT');
    }

    return Object.freeze({ ...payment }) as Payment;
  }
}
