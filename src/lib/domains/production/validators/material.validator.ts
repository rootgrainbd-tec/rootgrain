import { MaterialConsumption } from '../types/material-consumption';
import { ProductionException } from '../exceptions/production.exception';

export class MaterialValidator {
  static validate(consumption: Partial<MaterialConsumption>): MaterialConsumption {
    const errors: Record<string, string[]> = {};

    if (!consumption.material_id || typeof consumption.material_id !== 'string') {
      errors['material_id'] = ['Required and must be a string'];
    }
    
    if (typeof consumption.consumed_quantity !== 'number' || consumption.consumed_quantity <= 0) {
      errors['consumed_quantity'] = ['Must be a positive number greater than 0'];
    }

    if (typeof consumption.remaining_quantity !== 'number' || consumption.remaining_quantity < 0) {
      errors['remaining_quantity'] = ['Must be a non-negative number'];
    }
    
    if (!(consumption.timestamp instanceof Date)) {
      errors['timestamp'] = ['Required and must be a valid Date object'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ProductionException('Invalid material consumption data', 'INVALID_MATERIAL');
    }

    return Object.freeze({ ...consumption }) as MaterialConsumption;
  }
}
