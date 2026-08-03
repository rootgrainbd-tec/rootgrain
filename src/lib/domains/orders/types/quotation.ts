import { OrderItem } from './order-item';
import { OrderStatus } from './order-status';

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_id: string;
  status: OrderStatus;
  items: OrderItem[];
  valid_until: Date;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  created_at: Date;
}
