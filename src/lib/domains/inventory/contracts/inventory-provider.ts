import { InventoryItem } from '../types/inventory-item';

export interface InventoryProvider {
  getInventoryItem(id: string): Promise<InventoryItem | null>;
  getItemsByResource(resourceId: string): Promise<InventoryItem[]>;
  checkAvailability(resourceId: string, requiredQuantity: number): Promise<boolean>;
}
