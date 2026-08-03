import { Dimensions } from '../types/dimensions';
import { ValidationException } from '../exceptions/validation.exception';

export class DimensionsValidator {
  static validate(dimensions: Partial<Dimensions>): Dimensions {
    const errors: Record<string, string[]> = {};

    if (typeof dimensions.length !== 'number' || dimensions.length < 0) {
      errors['length'] = ['Must be a positive number'];
    }
    if (typeof dimensions.width !== 'number' || dimensions.width < 0) {
      errors['width'] = ['Must be a positive number'];
    }
    if (typeof dimensions.height !== 'number' || dimensions.height < 0) {
      errors['height'] = ['Must be a positive number'];
    }
    if (typeof dimensions.weight !== 'number' || dimensions.weight < 0) {
      errors['weight'] = ['Must be a positive number'];
    }
    
    const validUnits = ['cm', 'm', 'in', 'kg', 'g', 'lb'];
    if (!dimensions.unit || !validUnits.includes(dimensions.unit)) {
      errors['unit'] = [`Must be one of: ${validUnits.join(', ')}`];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationException('Invalid dimensions provided', errors);
    }

    // Return immutable copy
    return Object.freeze({ ...dimensions }) as Dimensions;
  }
}
