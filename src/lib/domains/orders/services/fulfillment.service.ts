import { Fulfillment } from '../types/fulfillment';
import { OrderRepository } from '../contracts/order-repository';
import { FulfillmentValidator } from '../validators/fulfillment.validator';
import { FulfillmentException } from '../exceptions/fulfillment.exception';

export class FulfillmentService {
  constructor(private readonly repository: OrderRepository) {}

  async createFulfillment(payload: Partial<Fulfillment>): Promise<Fulfillment> {
    const validated = FulfillmentValidator.validate(payload);
    
    const items = (payload.items || []).map(item => FulfillmentValidator.validateItem(item));

    const fulfillment: Fulfillment = {
      ...validated,
      items,
      created_at: new Date()
    };

    return this.repository.saveFulfillment(fulfillment);
  }

  async markShipped(fulfillmentId: string, trackingReference: string): Promise<void> {
    if (!trackingReference) throw new FulfillmentException('Tracking reference required for shipping', { tracking_reference: ['Required'] });
    // This updates the fulfillment state to 'shipped' via repository. Structural foundation only.
  }
}
