import { OrderStatus } from './order-status';
import { OrderItem } from './order-item';
import { ORDER_TYPES } from '../constants/order.constants';

export type OrderType = typeof ORDER_TYPES[keyof typeof ORDER_TYPES];

export interface OrderFulfillmentInfo {
  fulfilled_quantity: number;
  pending_quantity: number;
  cancelled_quantity: number;
}

export interface Order {
  id: string;
  type: OrderType;
  order_number: string;
  reference?: string;
  customer_id: string;
  status: OrderStatus;
  items: OrderItem[];
  
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  
  fulfillment_info: OrderFulfillmentInfo;
  
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}
