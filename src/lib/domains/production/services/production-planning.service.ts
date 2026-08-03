import { ProductionPlanning } from '../types/production-order';
import { ProductionException } from '../exceptions/production.exception';

export class ProductionPlanningService {
  static adjustPlanning(current: ProductionPlanning, plannedAdjustment: number): ProductionPlanning {
    const newPlanned = current.planned_quantity + plannedAdjustment;
    if (newPlanned <= 0) {
      throw new ProductionException('Adjusted planned quantity must remain positive', 'INVALID_ADJUSTMENT');
    }
    
    if (newPlanned < current.completed_quantity) {
      throw new ProductionException('Cannot reduce planned quantity below already completed quantity', 'INVALID_ADJUSTMENT');
    }

    return Object.freeze({
      ...current,
      planned_quantity: newPlanned
    });
  }
}
