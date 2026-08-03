import { Quotation } from '../types/quotation';
import { OrderRepository } from '../contracts/order-repository';
import { QuotationValidator } from '../validators/quotation.validator';
import { OrderException } from '../exceptions/order.exception';

export class QuotationService {
  constructor(private readonly repository: OrderRepository) {}

  async createQuotation(payload: Partial<Quotation>): Promise<Quotation> {
    const validated = QuotationValidator.validate(payload);
    
    const quotation: Quotation = {
      ...validated,
      items: payload.items || [],
      created_at: new Date()
    };

    return this.repository.saveQuotation(quotation);
  }

  async convertToOrder(quotationId: string): Promise<void> {
    const existing = await this.repository.findQuotationById(quotationId);
    if (!existing) throw new OrderException(`Quotation not found: ${quotationId}`, 'NOT_FOUND');
    
    const now = new Date();
    if (existing.valid_until < now) {
      throw new OrderException('Quotation has expired', 'QUOTATION_EXPIRED');
    }
    
    if (existing.status !== 'pending' && existing.status !== 'draft') {
       throw new OrderException(`Quotation cannot be converted from state: ${existing.status}`, 'INVALID_STATE');
    }

    // Actual conversion logic goes here, creating an Order via OrderService.
    // Omitted implementation details to keep to structural foundations.
  }
}
