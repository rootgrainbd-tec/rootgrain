export class EventException extends Error {
  constructor(
    public readonly type: 'VALIDATION_ERROR' | 'LIFECYCLE_ERROR' | 'REGISTRY_ERROR' | 'HANDLER_ERROR' | 'DISPATCH_ERROR',
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'EventException';
  }

  static validation(message: string, details?: Record<string, any>): EventException {
    return new EventException('VALIDATION_ERROR', message, details);
  }

  static lifecycle(message: string, details?: Record<string, any>): EventException {
    return new EventException('LIFECYCLE_ERROR', message, details);
  }

  static registry(message: string, details?: Record<string, any>): EventException {
    return new EventException('REGISTRY_ERROR', message, details);
  }

  static handler(message: string, details?: Record<string, any>): EventException {
    return new EventException('HANDLER_ERROR', message, details);
  }

  static dispatch(message: string, details?: Record<string, any>): EventException {
    return new EventException('DISPATCH_ERROR', message, details);
  }
}
