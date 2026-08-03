import { EndpointSecurityRegistry, EndpointSecurityLevel } from '../registry/endpoint-security.registry';
import { SecurityPolicy } from '../policies/security.policy';

export function Authorize() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const config = {
      path: 'derived_path',
      method: 'GET',
      level: EndpointSecurityLevel.AUTHENTICATED
    };
    SecurityPolicy.validate(config);
    EndpointSecurityRegistry.register(config);
  };
}
