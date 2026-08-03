import { TraceContract } from '../contracts/trace.contract';
import { ObservabilityException } from '../exceptions/observability.exception';

export class TraceValidator {
  static validateImmutability(trace: TraceContract): void {
     if (!Object.isFrozen(trace)) {
       throw ObservabilityException.trace('Trace context must be strictly immutable');
     }
  }
}
