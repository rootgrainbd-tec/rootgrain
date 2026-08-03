import { Order } from '../types/order';

export interface OrderServiceContract {
  createOrder(order: Partial<Order>): Promise<Order>;
  cancelOrder(orderId: string): Promise<void>;
  updateStatus(orderId: string, status: string): Promise<void>;
}
