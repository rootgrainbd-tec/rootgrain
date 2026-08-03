import { TraceabilityContract } from '../contracts/traceability.contract';
import { AuditException } from '../exceptions/audit.exception';

export class TraceValidator {
  static validate(contract: TraceabilityContract): void {
     if (!contract.trace_id || !contract.actor || !contract.action) {
        throw AuditException.validation("Trace record missing critical actor or action identifiers");
     }
  }
}
