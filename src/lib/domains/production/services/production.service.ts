import { ProductionServiceContract } from '../contracts/production-service';
import { ProductionRepository } from '../contracts/production-repository';
import { ProductionOrder, ProductionPlanning } from '../types/production-order';
import { MaterialConsumption } from '../types/material-consumption';
import { ProductionOutput } from '../types/production-output';
import { ProductionValidator } from '../validators/production.validator';
import { MaterialValidator } from '../validators/material.validator';
import { ProductionException } from '../exceptions/production.exception';

// Note: AuthorizationMiddleware wraps all entries here
export class ProductionService implements ProductionServiceContract {
  constructor(private readonly repository: ProductionRepository) {}

  async createOrder(orderPayload: Partial<ProductionOrder>): Promise<ProductionOrder> {
    const validatedOrder = ProductionValidator.validateOrder(orderPayload);
    if (!orderPayload.planning) throw new ProductionException('Planning required', 'MISSING_PLANNING');
    const validatedPlanning = ProductionValidator.validatePlanning(orderPayload.planning);

    const order: ProductionOrder = {
      ...validatedOrder,
      planning: validatedPlanning,
      materials_consumed: [],
      outputs: [],
      created_at: new Date(),
    };
    
    return this.repository.saveOrder(order);
  }

  async updatePlanning(orderId: string, planningPayload: Partial<ProductionPlanning>): Promise<void> {
    const existing = await this.repository.findOrderById(orderId);
    if (!existing) throw new ProductionException(`Order not found: ${orderId}`, 'NOT_FOUND');
    
    const validatedPlanning = ProductionValidator.validatePlanning({
       ...existing.planning,
       ...planningPayload
    });

    await this.repository.updateOrder(orderId, { planning: validatedPlanning });
  }

  async recordConsumption(orderId: string, consumptionPayload: Partial<MaterialConsumption>): Promise<void> {
    const existing = await this.repository.findOrderById(orderId);
    if (!existing) throw new ProductionException(`Order not found: ${orderId}`, 'NOT_FOUND');
    
    const validatedConsumption = MaterialValidator.validate(consumptionPayload);
    await this.repository.addConsumption(orderId, validatedConsumption);
  }

  async recordOutput(orderId: string, outputPayload: Partial<ProductionOutput>): Promise<void> {
    const existing = await this.repository.findOrderById(orderId);
    if (!existing) throw new ProductionException(`Order not found: ${orderId}`, 'NOT_FOUND');
    
    // Output validation is assumed simple enough for now, mapped straight through.
    if (!outputPayload.id || typeof outputPayload.quantity !== 'number') {
       throw new ProductionException('Invalid output structure', 'INVALID_OUTPUT');
    }
    await this.repository.addOutput(orderId, outputPayload as ProductionOutput);
  }

  async updateStatus(orderId: string, status: string): Promise<void> {
    const existing = await this.repository.findOrderById(orderId);
    if (!existing) throw new ProductionException(`Order not found: ${orderId}`, 'NOT_FOUND');
    
    await this.repository.updateOrder(orderId, { status: status as any });
  }
}
