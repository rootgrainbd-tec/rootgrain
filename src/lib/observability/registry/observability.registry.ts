import { LoggerContract } from '../contracts/logger.contract';
import { ObservabilityException } from '../exceptions/observability.exception';

export class ObservabilityRegistry {
  private static registeredTypes = new Set<string>();
  private static logger: LoggerContract | null = null;

  static registerEventType(type: string): void {
    if (this.registeredTypes.has(type)) {
      throw ObservabilityException.registry(`Audit event type ${type} is already registered`);
    }
    this.registeredTypes.add(type);
  }

  static validateEventType(type: string): void {
    if (!this.registeredTypes.has(type)) {
      throw ObservabilityException.registry(`Audit event type ${type} is not registered`);
    }
  }

  static registerLogger(logger: LoggerContract): void {
    if (this.logger) {
       throw ObservabilityException.registry('Logger is already registered');
    }
    this.logger = logger;
  }

  static getLogger(): LoggerContract {
    if (!this.logger) {
       throw ObservabilityException.registry('No logger registered in ObservabilityRegistry');
    }
    return this.logger;
  }

  static __reset(): void {
    this.registeredTypes.clear();
    this.logger = null;
  }
}
