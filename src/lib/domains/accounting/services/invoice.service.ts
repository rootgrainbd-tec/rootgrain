import { Invoice } from '../types/invoice';
import { AccountingRepository } from '../contracts/accounting-repository';
import { InvoiceValidator } from '../validators/invoice.validator';
import { AccountingException } from '../exceptions/accounting.exception';

export class InvoiceService {
  constructor(private readonly repository: AccountingRepository) {}

  async createInvoice(payload: Partial<Invoice>): Promise<Invoice> {
    let payment_info = payload.payment_info;
    if (!payment_info) {
       payment_info = { paid_amount: 0, due_amount: payload.total || 0, outstanding_amount: payload.total || 0 };
    }
    
    const validatedInfo = InvoiceValidator.validatePaymentInfo(payment_info);
    
    const validated = InvoiceValidator.validateInvoice({
      ...payload,
      payment_info: validatedInfo
    });
    
    const invoice: Invoice = {
      ...validated,
      payments: payload.payments || [],
      created_at: new Date(),
      updated_at: new Date()
    };

    return this.repository.saveInvoice(invoice);
  }

  async applyPaymentToInvoice(invoiceId: string, paidAmount: number): Promise<void> {
    const existing = await this.repository.findInvoiceById(invoiceId);
    if (!existing) throw new AccountingException(`Invoice not found: ${invoiceId}`, 'NOT_FOUND');
    
    if (paidAmount <= 0) throw new AccountingException('Payment amount must be positive', 'INVALID_AMOUNT');
    
    const info = existing.payment_info;
    const newPaidAmount = info.paid_amount + paidAmount;
    const newOutstanding = existing.total - newPaidAmount;
    
    if (newOutstanding < 0) {
      throw new AccountingException('Payment exceeds outstanding invoice amount', 'EXCESS_PAYMENT');
    }

    let nextStatus = existing.status;
    if (newOutstanding === 0) {
       nextStatus = 'paid';
    } else if (newOutstanding < existing.total) {
       nextStatus = 'partially_paid';
    }

    const validatedInfo = InvoiceValidator.validatePaymentInfo({
      paid_amount: newPaidAmount,
      due_amount: info.due_amount,
      outstanding_amount: newOutstanding
    });

    await this.repository.updateInvoice(invoiceId, { 
      payment_info: validatedInfo, 
      status: nextStatus,
      updated_at: new Date()
    });
  }
}
