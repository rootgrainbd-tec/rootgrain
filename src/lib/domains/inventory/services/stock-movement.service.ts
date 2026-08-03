import { StockLevel } from '../types/stock-level';
import { StockMovement } from '../types/stock-movement';
import { StockException } from '../exceptions/stock.exception';

export class StockMovementService {
  static applyMovement(currentStock: StockLevel, movement: StockMovement): StockLevel {
    const newStock = { ...currentStock };

    switch (movement.movement_type) {
      case 'inbound':
        newStock.quantity += movement.quantity;
        newStock.available_quantity += movement.quantity;
        break;
      case 'outbound':
      case 'consumption':
        if (newStock.quantity < movement.quantity) {
          throw new StockException(`Cannot process ${movement.movement_type}: insufficient total quantity`, { quantity: ['Insufficient stock'] });
        }
        // Deduct from total. Assumes allocation logic has moved it from allocated to gone, 
        // or directly deducts if unallocated. Simplified here for structural foundations.
        newStock.quantity -= movement.quantity;
        break;
      case 'transfer':
      case 'adjustment':
        // Complex logic deferred, but structure maintained
        break;
      default:
        throw new StockException(`Unsupported movement type: ${movement.movement_type}`, { movement_type: ['Unsupported'] });
    }

    // Freeze state transition
    return Object.freeze(newStock) as StockLevel;
  }
}
