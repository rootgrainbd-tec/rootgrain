import { OUTPUT_TYPES } from '../constants/production.constants';

export type OutputType = typeof OUTPUT_TYPES[keyof typeof OUTPUT_TYPES];

export interface ProductionOutput {
  id: string;
  type: OutputType;
  resource_id: string;
  quantity: number;
}
