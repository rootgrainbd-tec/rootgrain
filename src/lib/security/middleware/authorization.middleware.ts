import { SecurityException } from '../exceptions/security.exception';
import { EndpointSecurityRegistry, EndpointSecurityLevel } from '../registry/endpoint-security.registry';
// Note: Phase 2 logic would be invoked here. We stub the structural boundary.

export class AuthorizationMiddleware {
  static process(req: any): any {
    const method = req.method;
    const path = req.path; // e.g. '/api/v1/resources'
    const config = EndpointSecurityRegistry.getConfiguration(method, path);

    if (config.level === EndpointSecurityLevel.PUBLIC) {
      return req; // Explicitly allowed
    }

    if (!req.securityContext) {
      throw SecurityException.unauthenticated('Context missing during authorization check');
    }

    if (config.level === EndpointSecurityLevel.AUTHENTICATED) {
       return req; // Already authenticated
    }

    if (config.level === EndpointSecurityLevel.AUTHORIZED) {
       if (!config.permissions || config.permissions.length === 0) {
           throw SecurityException.configError('Authorized endpoint missing permission mappings');
       }
       
       // Example fail-closed stub for Phase 2 delegation
       const hasPermission = true; // In reality: Phase2AuthEngine.check(req.securityContext, config.permissions)
       if (!hasPermission) {
          throw SecurityException.forbidden('Insufficient permissions');
       }
    }

    return req;
  }
}
