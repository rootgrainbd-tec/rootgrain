import { EndpointSecurityConfig, EndpointSecurityLevel } from '../registry/endpoint-security.registry';
import { SecurityException } from '../exceptions/security.exception';

export class PolicyValidator {
  static validateConfig(config: EndpointSecurityConfig): void {
    if (config.level === EndpointSecurityLevel.AUTHORIZED) {
      if (!config.permissions || config.permissions.length === 0) {
         throw SecurityException.configError(`Endpoint ${config.method} ${config.path} requires permissions for AUTHORIZED level.`);
      }
    }
    
    if (config.level !== EndpointSecurityLevel.AUTHORIZED && config.permissions && config.permissions.length > 0) {
         throw SecurityException.configError(`Permissions should only be defined for AUTHORIZED endpoints.`);
    }
  }
}
