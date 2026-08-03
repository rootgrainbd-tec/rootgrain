import { ProductionStatus } from './production-status';
import { MaterialConsumption } from './material-consumption';
import { ProductionOutput } from './production-output';

export interface ProductionPlanning {
  planned_quantity: number;
  completed_quantity: number;
  rejected_quantity: number;
}

export interface ProductionOrder {
  id: string;
  reference: string;
  resource_id: string;
  batch_id?: string;
  status: ProductionStatus;
  planning: ProductionPlanning;
  materials_consumed: MaterialConsumption[];
  outputs: ProductionOutput[];
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
}
