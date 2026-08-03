export class CommunicationException extends Error {
  constructor(
    public readonly type: 'VALIDATION_ERROR' | 'LIFECYCLE_ERROR' | 'REGISTRY_ERROR' | 'DELIVERY_ERROR' | 'TEMPLATE_ERROR' | 'CHANNEL_ERROR',
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'CommunicationException';
  }

  static validation(message: string, details?: Record<string, any>): CommunicationException {
    return new CommunicationException('VALIDATION_ERROR', message, details);
  }

  static lifecycle(message: string, details?: Record<string, any>): CommunicationException {
    return new CommunicationException('LIFECYCLE_ERROR', message, details);
  }

  static registry(message: string, details?: Record<string, any>): CommunicationException {
    return new CommunicationException('REGISTRY_ERROR', message, details);
  }

  static delivery(message: string, details?: Record<string, any>): CommunicationException {
    return new CommunicationException('DELIVERY_ERROR', message, details);
  }

  static template(message: string, details?: Record<string, any>): CommunicationException {
    return new CommunicationException('TEMPLATE_ERROR', message, details);
  }

  static channel(message: string, details?: Record<string, any>): CommunicationException {
    return new CommunicationException('CHANNEL_ERROR', message, details);
  }
}
