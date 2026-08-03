import { Invoice } from '../types/invoice';
import { Payment } from '../types/payment';

export interface AccountingProvider {
  getInvoice(id: string): Promise<Invoice | null>;
  getPayment(id: string): Promise<Payment | null>;
  getInvoicesByCustomer(customerId: string): Promise<Invoice[]>;
}
