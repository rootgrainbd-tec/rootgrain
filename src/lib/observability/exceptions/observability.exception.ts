export class ObservabilityException extends Error {
  constructor(
    public readonly type: 'VALIDATION_ERROR' | 'LIFECYCLE_ERROR' | 'REGISTRY_ERROR' | 'LOGGING_ERROR' | 'TRACE_ERROR',
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ObservabilityException';
  }

  static validation(message: string, details?: Record<string, any>): ObservabilityException {
    return new ObservabilityException('VALIDATION_ERROR', message, details);
  }

  static lifecycle(message: string, details?: Record<string, any>): ObservabilityException {
    return new ObservabilityException('LIFECYCLE_ERROR', message, details);
  }

  static registry(message: string, details?: Record<string, any>): ObservabilityException {
    return new ObservabilityException('REGISTRY_ERROR', message, details);
  }

  static logging(message: string, details?: Record<string, any>): ObservabilityException {
    return new ObservabilityException('LOGGING_ERROR', message, details);
  }

  static trace(message: string, details?: Record<string, any>): ObservabilityException {
    return new ObservabilityException('TRACE_ERROR', message, details);
  }
}
