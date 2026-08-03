import { Order } from '../types/order';
import { Quotation } from '../types/quotation';
import { Fulfillment } from '../types/fulfillment';

export interface OrderRepository {
  findOrderById(id: string): Promise<Order | null>;
  findQuotationById(id: string): Promise<Quotation | null>;
  saveOrder(order: Order): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order>;
  saveQuotation(quotation: Quotation): Promise<Quotation>;
  saveFulfillment(fulfillment: Fulfillment): Promise<Fulfillment>;
}
