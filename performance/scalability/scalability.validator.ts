import { CapacityModel } from './capacity.model';
import { PerformanceException } from '../exceptions/performance.exception';

export class ScalabilityValidator {
  static validateCapacity(model: CapacityModel): void {
     if (model.current_capacity < 0 || model.projected_capacity < 0) {
        throw PerformanceException.validation("Capacities cannot be negative");
     }
  }
}
