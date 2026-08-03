import { SeverityLevel } from '../policies/severity.policy';
import { ObservabilityRegistry } from '../registry/observability.registry';

export class LoggerService {
  static log(level: SeverityLevel, message: string, context?: Record<string, any>): void {
     const logger = ObservabilityRegistry.getLogger();
     logger.log(level, message, context);
  }
}
