import { ProductionBatch } from '../types/production-batch';
import { VALID_BATCH_STATES } from '../constants/batch.constants';
import { BatchException } from '../exceptions/batch.exception';

export class BatchValidator {
  static validate(batch: Partial<ProductionBatch>): ProductionBatch {
    const errors: Record<string, string[]> = {};

    if (!batch.id || typeof batch.id !== 'string') errors['id'] = ['Required'];
    if (!batch.batch_id || typeof batch.batch_id !== 'string') errors['batch_id'] = ['Required'];
    if (!batch.order_id || typeof batch.order_id !== 'string') errors['order_id'] = ['Required'];
    
    if (!batch.status || !VALID_BATCH_STATES.includes(batch.status)) {
      errors['status'] = [`Must be a valid status: ${VALID_BATCH_STATES.join(', ')}`];
    }

    if (Object.keys(errors).length > 0) {
      throw new BatchException('Invalid production batch data', errors);
    }

    return Object.freeze({ ...batch }) as ProductionBatch;
  }
}
