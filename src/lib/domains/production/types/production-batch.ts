import { BATCH_STATUS } from '../constants/batch.constants';

export type BatchStatus = typeof BATCH_STATUS[keyof typeof BATCH_STATUS];

export interface ProductionBatch {
  id: string;
  batch_id: string;
  reference?: string;
  status: BatchStatus;
  order_id: string;
  created_at: Date;
  completed_at?: Date;
}
