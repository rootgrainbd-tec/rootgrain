import { ProductionException } from './production.exception';

export class BatchException extends ProductionException {
  constructor(message: string, public readonly errors: Record<string, string[]>) {
    super(message, 'BATCH_OPERATION_FAILED');
    this.name = 'BatchException';
  }
}
