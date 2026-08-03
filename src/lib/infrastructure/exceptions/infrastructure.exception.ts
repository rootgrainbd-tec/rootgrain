export class InfrastructureException extends Error {
  constructor(
    public readonly type: 'VALIDATION_ERROR' | 'LIFECYCLE_ERROR' | 'REGISTRY_ERROR' | 'RESOLUTION_ERROR' | 'HEALTH_ERROR',
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'InfrastructureException';
  }

  static validation(message: string, details?: Record<string, any>): InfrastructureException {
    return new InfrastructureException('VALIDATION_ERROR', message, details);
  }

  static lifecycle(message: string, details?: Record<string, any>): InfrastructureException {
    return new InfrastructureException('LIFECYCLE_ERROR', message, details);
  }

  static registry(message: string, details?: Record<string, any>): InfrastructureException {
    return new InfrastructureException('REGISTRY_ERROR', message, details);
  }

  static resolution(message: string, details?: Record<string, any>): InfrastructureException {
    return new InfrastructureException('RESOLUTION_ERROR', message, details);
  }

  static health(message: string, details?: Record<string, any>): InfrastructureException {
    return new InfrastructureException('HEALTH_ERROR', message, details);
  }
}
