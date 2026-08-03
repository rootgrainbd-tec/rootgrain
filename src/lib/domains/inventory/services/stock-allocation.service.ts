import { StockLevel } from '../types/stock-level';
import { StockException } from '../exceptions/stock.exception';

export class StockAllocationService {
  static allocate(stock: StockLevel, quantity: number): StockLevel {
    if (quantity <= 0) throw new StockException('Allocation quantity must be positive', { quantity: ['Must be positive'] });
    if (stock.available_quantity < quantity) {
      throw new StockException('Insufficient available stock for allocation', { available_quantity: ['Not enough stock'] });
    }

    return Object.freeze({
      ...stock,
      available_quantity: stock.available_quantity - quantity,
      allocated_quantity: stock.allocated_quantity + quantity
    });
  }

  static releaseAllocation(stock: StockLevel, quantity: number): StockLevel {
    if (quantity <= 0) throw new StockException('Release quantity must be positive', { quantity: ['Must be positive'] });
    if (stock.allocated_quantity < quantity) {
      throw new StockException('Cannot release more than allocated', { allocated_quantity: ['Too few allocated items'] });
    }

    return Object.freeze({
      ...stock,
      available_quantity: stock.available_quantity + quantity,
      allocated_quantity: stock.allocated_quantity - quantity
    });
  }
}
