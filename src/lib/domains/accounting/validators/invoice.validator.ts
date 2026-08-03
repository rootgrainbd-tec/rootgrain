import { Invoice, InvoicePaymentInfo } from '../types/invoice';
import { VALID_ACCOUNTING_STATES } from '../constants/accounting.constants';
import { AccountingException } from '../exceptions/accounting.exception';

export class InvoiceValidator {
  static validatePaymentInfo(info: Partial<InvoicePaymentInfo>): InvoicePaymentInfo {
    const errors: Record<string, string[]> = {};

    if (typeof info.paid_amount !== 'number' || info.paid_amount < 0) {
      errors['paid_amount'] = ['Must be a non-negative number'];
    }
    if (typeof info.due_amount !== 'number' || info.due_amount < 0) {
      errors['due_amount'] = ['Must be a non-negative number'];
    }
    if (typeof info.outstanding_amount !== 'number' || info.outstanding_amount < 0) {
      errors['outstanding_amount'] = ['Must be a non-negative number'];
    }

    if (Object.keys(errors).length > 0) {
      throw new AccountingException('Invalid invoice payment info', 'INVALID_PAYMENT_INFO');
    }

    return Object.freeze({ ...info }) as InvoicePaymentInfo;
  }

  static validateInvoice(invoice: Partial<Invoice>): Invoice {
    const errors: Record<string, string[]> = {};

    if (!invoice.id || typeof invoice.id !== 'string') errors['id'] = ['Required'];
    if (!invoice.invoice_number || typeof invoice.invoice_number !== 'string') errors['invoice_number'] = ['Required'];
    if (!invoice.customer_id || typeof invoice.customer_id !== 'string') errors['customer_id'] = ['Required'];

    if (!invoice.status || !VALID_ACCOUNTING_STATES.includes(invoice.status)) {
      errors['status'] = [`Must be a valid status: ${VALID_ACCOUNTING_STATES.join(', ')}`];
    }

    // Mathematical integrity logic check for invoice totals
    const computedTotal = (invoice.subtotal || 0) - (invoice.discount || 0) + (invoice.tax || 0);
    if (typeof invoice.total === 'number' && Math.abs(invoice.total - computedTotal) > 0.01) {
      errors['total'] = [`Total (${invoice.total}) does not match subtotal - discount + tax (${computedTotal})`];
    }

    // Mathematical integrity logic check for payment amounts
    if (invoice.payment_info) {
       const info = invoice.payment_info;
       if (typeof invoice.total === 'number' && typeof info.paid_amount === 'number' && typeof info.outstanding_amount === 'number') {
           const computedOutstanding = invoice.total - info.paid_amount;
           if (Math.abs(info.outstanding_amount - computedOutstanding) > 0.01) {
              errors['outstanding_amount'] = [`Outstanding amount (${info.outstanding_amount}) does not match total - paid (${computedOutstanding})`];
           }
       }
    }

    if (Object.keys(errors).length > 0) {
      throw new AccountingException('Invalid invoice base properties', 'INVALID_INVOICE');
    }

    return Object.freeze({ ...invoice }) as Invoice;
  }
}
