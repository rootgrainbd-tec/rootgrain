import { ProductionOrder } from '../types/production-order';
import { ProductionBatch } from '../types/production-batch';
import { MaterialConsumption } from '../types/material-consumption';
import { ProductionOutput } from '../types/production-output';

export interface ProductionRepository {
  findOrderById(id: string): Promise<ProductionOrder | null>;
  findBatchById(id: string): Promise<ProductionBatch | null>;
  saveOrder(order: ProductionOrder): Promise<ProductionOrder>;
  updateOrder(id: string, updates: Partial<ProductionOrder>): Promise<ProductionOrder>;
  saveBatch(batch: ProductionBatch): Promise<ProductionBatch>;
  addConsumption(orderId: string, consumption: MaterialConsumption): Promise<void>;
  addOutput(orderId: string, output: ProductionOutput): Promise<void>;
}
