import { AuthenticationMiddleware } from './authentication.middleware';
import { AuthorizationMiddleware } from './authorization.middleware';
import { EndpointSecurityRegistry, EndpointSecurityLevel } from '../registry/endpoint-security.registry';

export class SecurityMiddleware {
  static executePipeline(req: any): any {
    // 1. Identify classification
    const method = req.method;
    const path = req.path;
    const config = EndpointSecurityRegistry.getConfiguration(method, path);

    if (config.level === EndpointSecurityLevel.PUBLIC) {
      return req; // Bypass security pipeline
    }

    // 2. Authenticate
    let secureReq = AuthenticationMiddleware.process(req);

    // 3. Authorize
    secureReq = AuthorizationMiddleware.process(secureReq);

    return secureReq;
  }
}
