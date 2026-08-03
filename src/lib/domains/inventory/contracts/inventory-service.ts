import { InventoryItem } from '../types/inventory-item';
import { StockMovement } from '../types/stock-movement';

export interface InventoryServiceContract {
  createItem(item: Partial<InventoryItem>): Promise<InventoryItem>;
  recordMovement(itemId: string, movement: Partial<StockMovement>): Promise<void>;
  updateStatus(itemId: string, status: string): Promise<void>;
}
