import { OrderException } from './order.exception';

export class FulfillmentException extends OrderException {
  constructor(message: string, public readonly errors: Record<string, string[]>) {
    super(message, 'FULFILLMENT_OPERATION_FAILED');
    this.name = 'FulfillmentException';
  }
}
