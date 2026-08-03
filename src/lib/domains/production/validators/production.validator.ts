import { ProductionOrder, ProductionPlanning } from '../types/production-order';
import { VALID_PRODUCTION_STATES } from '../constants/production.constants';
import { ProductionException } from '../exceptions/production.exception';

export class ProductionValidator {
  static validatePlanning(planning: Partial<ProductionPlanning>): ProductionPlanning {
    const errors: Record<string, string[]> = {};

    if (typeof planning.planned_quantity !== 'number' || planning.planned_quantity <= 0) {
      errors['planned_quantity'] = ['Must be a positive number greater than 0'];
    }
    if (typeof planning.completed_quantity !== 'number' || planning.completed_quantity < 0) {
      errors['completed_quantity'] = ['Must be a non-negative number'];
    }
    if (typeof planning.rejected_quantity !== 'number' || planning.rejected_quantity < 0) {
      errors['rejected_quantity'] = ['Must be a non-negative number'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ProductionException('Invalid production planning data', 'INVALID_PLANNING');
    }

    return Object.freeze({ ...planning }) as ProductionPlanning;
  }

  static validateOrder(order: Partial<ProductionOrder>): ProductionOrder {
    const errors: Record<string, string[]> = {};

    if (!order.id || typeof order.id !== 'string') errors['id'] = ['Required'];
    if (!order.reference || typeof order.reference !== 'string') errors['reference'] = ['Required'];
    if (!order.resource_id || typeof order.resource_id !== 'string') errors['resource_id'] = ['Required'];

    if (!order.status || !VALID_PRODUCTION_STATES.includes(order.status)) {
      errors['status'] = [`Must be a valid status: ${VALID_PRODUCTION_STATES.join(', ')}`];
    }

    if (Object.keys(errors).length > 0) {
      throw new ProductionException('Invalid production order base properties', 'INVALID_ORDER');
    }

    return Object.freeze({ ...order }) as ProductionOrder;
  }
}
