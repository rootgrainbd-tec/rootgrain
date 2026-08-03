import { InventoryItem } from '../types/inventory-item';
import { WarehouseLocation } from '../types/warehouse-location';
import { VALID_STOCK_STATES } from '../constants/inventory.constants';
import { InventoryException } from '../exceptions/inventory.exception';

export class InventoryValidator {
  static validateLocation(location: Partial<WarehouseLocation>): WarehouseLocation {
    const errors: Record<string, string[]> = {};

    if (!location.warehouse_id || typeof location.warehouse_id !== 'string') {
      errors['warehouse_id'] = ['Required and must be a string'];
    }
    
    if (Object.keys(errors).length > 0) {
      throw new InventoryException('Invalid warehouse location', 'INVALID_LOCATION');
    }

    return Object.freeze({ ...location }) as WarehouseLocation;
  }

  static validateItem(item: Partial<InventoryItem>): InventoryItem {
    const errors: Record<string, string[]> = {};

    if (!item.id || typeof item.id !== 'string') errors['id'] = ['Required'];
    if (!item.resource_id || typeof item.resource_id !== 'string') errors['resource_id'] = ['Required'];
    if (!item.sku || typeof item.sku !== 'string') errors['sku'] = ['Required'];
    
    if (!item.status || !VALID_STOCK_STATES.includes(item.status)) {
      errors['status'] = [`Must be a valid status: ${VALID_STOCK_STATES.join(', ')}`];
    }

    if (Object.keys(errors).length > 0) {
      throw new InventoryException('Invalid inventory item base properties', 'INVALID_ITEM');
    }

    return Object.freeze({ ...item }) as InventoryItem;
  }
}
