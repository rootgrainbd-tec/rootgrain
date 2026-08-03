import { InventoryItem } from '../types/inventory-item';
import { StockMovement } from '../types/stock-movement';

export interface InventoryRepository {
  findById(id: string): Promise<InventoryItem | null>;
  findByResource(resourceId: string): Promise<InventoryItem[]>;
  saveItem(item: InventoryItem): Promise<InventoryItem>;
  updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem>;
  saveMovement(itemId: string, movement: StockMovement): Promise<void>;
}
