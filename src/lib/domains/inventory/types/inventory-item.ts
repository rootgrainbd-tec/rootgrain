import { StockLevel } from './stock-level';
import { StockStatus } from './stock-status';
import { WarehouseLocation } from './warehouse-location';

export interface InventoryItem {
  id: string;
  resource_id: string;
  sku: string;
  location: WarehouseLocation;
  stock: StockLevel;
  status: StockStatus;
  created_at: Date;
  updated_at: Date;
}
