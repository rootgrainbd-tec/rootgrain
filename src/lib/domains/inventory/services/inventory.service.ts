import { InventoryServiceContract } from '../contracts/inventory-service';
import { InventoryRepository } from '../contracts/inventory-repository';
import { InventoryItem } from '../types/inventory-item';
import { StockMovement } from '../types/stock-movement';
import { InventoryValidator } from '../validators/inventory.validator';
import { MovementValidator } from '../validators/movement.validator';
import { InventoryException } from '../exceptions/inventory.exception';

// Note: AuthorizationMiddleware wraps all entries here
export class InventoryService implements InventoryServiceContract {
  constructor(private readonly repository: InventoryRepository) {}

  async createItem(itemPayload: Partial<InventoryItem>): Promise<InventoryItem> {
    const validatedItem = InventoryValidator.validateItem(itemPayload);
    if (!itemPayload.location) throw new InventoryException('Location required', 'MISSING_LOCATION');
    const validatedLocation = InventoryValidator.validateLocation(itemPayload.location);

    const item: InventoryItem = {
      ...validatedItem,
      location: validatedLocation,
      stock: itemPayload.stock || { quantity: 0, available_quantity: 0, reserved_quantity: 0, allocated_quantity: 0 },
      created_at: new Date(),
      updated_at: new Date()
    };
    
    return this.repository.saveItem(item);
  }

  async recordMovement(itemId: string, movementPayload: Partial<StockMovement>): Promise<void> {
    const existing = await this.repository.findById(itemId);
    if (!existing) throw new InventoryException(`Item not found: ${itemId}`, 'NOT_FOUND');
    
    const validatedMovement = MovementValidator.validate(movementPayload);
    await this.repository.saveMovement(itemId, validatedMovement);
  }

  async updateStatus(itemId: string, status: string): Promise<void> {
    const existing = await this.repository.findById(itemId);
    if (!existing) throw new InventoryException(`Item not found: ${itemId}`, 'NOT_FOUND');
    
    await this.repository.updateItem(itemId, { status: status as any, updated_at: new Date() });
  }
}
