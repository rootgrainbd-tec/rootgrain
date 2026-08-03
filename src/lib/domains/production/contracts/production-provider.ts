import { ProductionOrder } from '../types/production-order';
import { ProductionBatch } from '../types/production-batch';

export interface ProductionProvider {
  getOrder(id: string): Promise<ProductionOrder | null>;
  getBatch(id: string): Promise<ProductionBatch | null>;
  getOrdersByResource(resourceId: string): Promise<ProductionOrder[]>;
}
