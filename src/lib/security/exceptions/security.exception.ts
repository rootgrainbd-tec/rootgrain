export class SecurityException extends Error {
  constructor(
    public readonly type: 'AUTHENTICATION_REQUIRED' | 'FORBIDDEN' | 'INVALID_CONTEXT' | 'CONFIGURATION_ERROR',
    message: string
  ) {
    super(message);
    this.name = 'SecurityException';
  }

  static unauthenticated(message: string = 'Authentication required'): SecurityException {
    return new SecurityException('AUTHENTICATION_REQUIRED', message);
  }

  static forbidden(message: string = 'Access denied'): SecurityException {
    return new SecurityException('FORBIDDEN', message);
  }

  static invalidContext(message: string = 'Invalid security context'): SecurityException {
    return new SecurityException('INVALID_CONTEXT', message);
  }

  static configError(message: string): SecurityException {
    return new SecurityException('CONFIGURATION_ERROR', message);
  }
}
