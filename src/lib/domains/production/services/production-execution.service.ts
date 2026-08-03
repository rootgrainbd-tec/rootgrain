import { ProductionStatus } from '../types/production-status';
import { ProductionException } from '../exceptions/production.exception';

export class ProductionExecutionService {
  static getValidNextStates(current: ProductionStatus): ProductionStatus[] {
    switch (current) {
      case 'planned': return ['queued', 'cancelled'];
      case 'queued': return ['in_progress', 'cancelled'];
      case 'in_progress': return ['paused', 'completed', 'cancelled'];
      case 'paused': return ['in_progress', 'cancelled'];
      case 'completed': return ['archived'];
      case 'cancelled': return ['archived'];
      case 'archived': return [];
      default: return [];
    }
  }

  static assertTransition(current: ProductionStatus, next: ProductionStatus): void {
    const valid = this.getValidNextStates(current);
    if (!valid.includes(next)) {
      throw new ProductionException(`Cannot transition production order from ${current} to ${next}`, 'INVALID_TRANSITION');
    }
  }
}
