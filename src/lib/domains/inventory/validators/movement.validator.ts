import { StockMovement } from '../types/stock-movement';
import { VALID_MOVEMENT_TYPES } from '../constants/movement.constants';
import { StockException } from '../exceptions/stock.exception';

export class MovementValidator {
  static validate(movement: Partial<StockMovement>): StockMovement {
    const errors: Record<string, string[]> = {};

    if (!movement.movement_id || typeof movement.movement_id !== 'string') {
      errors['movement_id'] = ['Required and must be a string'];
    }
    
    if (!movement.movement_type || !VALID_MOVEMENT_TYPES.includes(movement.movement_type)) {
      errors['movement_type'] = [`Must be a valid movement type: ${VALID_MOVEMENT_TYPES.join(', ')}`];
    }
    
    if (!(movement.timestamp instanceof Date)) {
      errors['timestamp'] = ['Required and must be a valid Date object'];
    }
    
    if (typeof movement.quantity !== 'number' || movement.quantity <= 0) {
      errors['quantity'] = ['Must be a positive number greater than 0'];
    }

    if (Object.keys(errors).length > 0) {
      throw new StockException('Invalid stock movement data', errors);
    }

    // Return immutable copy
    return Object.freeze({ ...movement }) as StockMovement;
  }
}
