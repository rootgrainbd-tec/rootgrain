import { MOVEMENT_TYPES } from '../constants/movement.constants';

export type MovementType = typeof MOVEMENT_TYPES[keyof typeof MOVEMENT_TYPES];

export interface StockMovement {
  movement_id: string;
  movement_type: MovementType;
  timestamp: Date;
  reference?: string;
  quantity: number;
}
