import { EndpointSecurityLevel } from '../registry/endpoint-security.registry';
import { SecurityException } from '../exceptions/security.exception';

export class SecurityValidator {
  static validateContext(context: any): void {
    if (!context || typeof context !== 'object') {
      throw SecurityException.invalidContext('Security context is missing');
    }
  }

  static validateLevel(level: any): void {
    if (!Object.values(EndpointSecurityLevel).includes(level)) {
      throw SecurityException.configError(`Invalid security level: ${level}`);
    }
  }
}
