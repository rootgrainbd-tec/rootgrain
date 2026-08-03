import { Invoice } from '../types/invoice';
import { Payment } from '../types/payment';
import { JournalEntry } from '../types/journal-entry';

export interface AccountingRepository {
  findInvoiceById(id: string): Promise<Invoice | null>;
  findPaymentById(id: string): Promise<Payment | null>;
  saveInvoice(invoice: Invoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
  savePayment(payment: Payment): Promise<Payment>;
  saveJournalEntry(entry: JournalEntry): Promise<JournalEntry>;
}
