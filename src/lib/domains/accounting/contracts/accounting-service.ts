import { Invoice } from '../types/invoice';
import { Payment } from '../types/payment';

export interface AccountingServiceContract {
  recordPayment(invoiceId: string, payment: Partial<Payment>): Promise<Payment>;
  updateInvoiceStatus(invoiceId: string, status: string): Promise<void>;
  calculateOutstandingBalance(customerId: string): Promise<number>;
}
