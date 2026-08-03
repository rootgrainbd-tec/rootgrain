import { OrderServiceContract } from '../contracts/order-service';
import { OrderRepository } from '../contracts/order-repository';
import { Order } from '../types/order';
import { OrderValidator } from '../validators/order.validator';
import { OrderException } from '../exceptions/order.exception';

// Note: AuthorizationMiddleware wraps all entries here
export class OrderService implements OrderServiceContract {
  constructor(private readonly repository: OrderRepository) {}

  async createOrder(orderPayload: Partial<Order>): Promise<Order> {
    const validatedOrder = OrderValidator.validateOrder(orderPayload);
    
    let fulfillment_info = orderPayload.fulfillment_info;
    if (!fulfillment_info) {
       fulfillment_info = { fulfilled_quantity: 0, pending_quantity: 0, cancelled_quantity: 0 };
    }
    const validatedFulfillment = OrderValidator.validateFulfillmentInfo(fulfillment_info);

    const order: Order = {
      ...validatedOrder,
      fulfillment_info: validatedFulfillment,
      items: orderPayload.items || [],
      created_at: new Date(),
      updated_at: new Date()
    };
    
    return this.repository.saveOrder(order);
  }

  async cancelOrder(orderId: string): Promise<void> {
    const existing = await this.repository.findOrderById(orderId);
    if (!existing) throw new OrderException(`Order not found: ${orderId}`, 'NOT_FOUND');
    
    if (existing.status === 'fulfilled' || existing.status === 'archived') {
       throw new OrderException(`Cannot cancel order in state: ${existing.status}`, 'INVALID_TRANSITION');
    }

    await this.repository.updateOrder(orderId, { status: 'cancelled', updated_at: new Date() });
  }

  async updateStatus(orderId: string, status: string): Promise<void> {
    const existing = await this.repository.findOrderById(orderId);
    if (!existing) throw new OrderException(`Order not found: ${orderId}`, 'NOT_FOUND');
    
    await this.repository.updateOrder(orderId, { status: status as any, updated_at: new Date() });
  }
}
