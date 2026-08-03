import { AuditContract } from '../contracts/audit.contract';
import { ObservabilityContext, AuditState } from './observability.context';
import { ObservabilityException } from '../exceptions/observability.exception';
import { AuditValidator } from '../validators/audit.validator';
import { ObservabilityRegistry } from '../registry/observability.registry';

export class AuditService {
  static async record(event: AuditContract): Promise<ObservabilityContext> {
    let context: ObservabilityContext = { auditId: event.id, state: AuditState.CREATED, timestamp: Date.now() };

    try {
      AuditValidator.validate(event);
      ObservabilityRegistry.validateEventType(event.type);

      context = { ...context, state: AuditState.VALIDATED, timestamp: Date.now() };
      
      // Stub: in reality this pushes to a queue or data store
      context = { ...context, state: AuditState.RECORDED, timestamp: Date.now() };
      
      return Object.freeze(context);
    } catch (e: any) {
      context = { ...context, state: AuditState.FAILED, error: e.message, timestamp: Date.now() };
      throw ObservabilityException.logging(`Audit recording failed: ${e.message}`, { auditId: event.id, originalError: e.message });
    }
  }
}
