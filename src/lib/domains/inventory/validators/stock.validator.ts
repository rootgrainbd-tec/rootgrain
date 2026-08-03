import { StockLevel } from '../types/stock-level';
import { StockException } from '../exceptions/stock.exception';

export class StockValidator {
  static validate(stock: Partial<StockLevel>): StockLevel {
    const errors: Record<string, string[]> = {};

    if (typeof stock.quantity !== 'number' || stock.quantity < 0) {
      errors['quantity'] = ['Must be a non-negative number'];
    }
    if (typeof stock.available_quantity !== 'number' || stock.available_quantity < 0) {
      errors['available_quantity'] = ['Must be a non-negative number'];
    }
    if (typeof stock.reserved_quantity !== 'number' || stock.reserved_quantity < 0) {
      errors['reserved_quantity'] = ['Must be a non-negative number'];
    }
    if (typeof stock.allocated_quantity !== 'number' || stock.allocated_quantity < 0) {
      errors['allocated_quantity'] = ['Must be a non-negative number'];
    }

    // Mathematical integrity check
    if (Object.keys(errors).length === 0) {
      const computedTotal = stock.available_quantity! + stock.reserved_quantity! + stock.allocated_quantity!;
      if (stock.quantity !== computedTotal) {
        errors['integrity'] = [`Total quantity (${stock.quantity}) does not match sum of available, reserved, and allocated (${computedTotal})`];
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new StockException('Invalid stock level data', errors);
    }

    // Return immutable copy
    return Object.freeze({ ...stock }) as StockLevel;
  }
}
