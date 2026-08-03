import { Order } from '../types/order';
import { Quotation } from '../types/quotation';

export interface OrderProvider {
  getOrder(id: string): Promise<Order | null>;
  getQuotation(id: string): Promise<Quotation | null>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
}
