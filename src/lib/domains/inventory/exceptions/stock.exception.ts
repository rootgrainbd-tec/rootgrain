import { InventoryException } from './inventory.exception';

export class StockException extends InventoryException {
  constructor(message: string, public readonly errors: Record<string, string[]>) {
    super(message, 'STOCK_OPERATION_FAILED');
    this.name = 'StockException';
  }
}
