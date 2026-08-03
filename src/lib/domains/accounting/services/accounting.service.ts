import { AccountingServiceContract } from '../contracts/accounting-service';
import { AccountingRepository } from '../contracts/accounting-repository';
import { Payment } from '../types/payment';
import { AccountingValidator } from '../validators/accounting.validator';
import { AccountingException } from '../exceptions/accounting.exception';

// Note: AuthorizationMiddleware wraps all entries here
export class AccountingService implements AccountingServiceContract {
  constructor(private readonly repository: AccountingRepository) {}

  async recordPayment(invoiceId: string, paymentPayload: Partial<Payment>): Promise<Payment> {
    const existing = await this.repository.findInvoiceById(invoiceId);
    if (!existing) throw new AccountingException(`Invoice not found: ${invoiceId}`, 'NOT_FOUND');
    
    if (existing.status === 'paid' || existing.status === 'archived' || existing.status === 'cancelled') {
       throw new AccountingException(`Cannot record payment for invoice in state: ${existing.status}`, 'INVALID_TRANSITION');
    }

    const validatedPayment = AccountingValidator.validatePayment({
        ...paymentPayload,
        invoice_id: invoiceId,
        payment_date: paymentPayload.payment_date || new Date()
    });
    
    return this.repository.savePayment(validatedPayment);
  }

  async updateInvoiceStatus(invoiceId: string, status: string): Promise<void> {
    const existing = await this.repository.findInvoiceById(invoiceId);
    if (!existing) throw new AccountingException(`Invoice not found: ${invoiceId}`, 'NOT_FOUND');
    
    await this.repository.updateInvoice(invoiceId, { status: status as any, updated_at: new Date() });
  }

  async calculateOutstandingBalance(customerId: string): Promise<number> {
    // Abstract calculation for the foundation
    return 0;
  }
}
