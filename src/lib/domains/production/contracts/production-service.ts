import { ProductionOrder, ProductionPlanning } from '../types/production-order';
import { MaterialConsumption } from '../types/material-consumption';
import { ProductionOutput } from '../types/production-output';

export interface ProductionServiceContract {
  createOrder(order: Partial<ProductionOrder>): Promise<ProductionOrder>;
  updatePlanning(orderId: string, planning: Partial<ProductionPlanning>): Promise<void>;
  recordConsumption(orderId: string, consumption: Partial<MaterialConsumption>): Promise<void>;
  recordOutput(orderId: string, output: Partial<ProductionOutput>): Promise<void>;
  updateStatus(orderId: string, status: string): Promise<void>;
}
