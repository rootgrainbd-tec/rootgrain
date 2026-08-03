import { EndpointSecurityRegistry, EndpointSecurityLevel } from '../registry/endpoint-security.registry';
import { SecurityPolicy } from '../policies/security.policy';

export function Public() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Decorator structural stub: In NestJS/Express this sets metadata.
    // Here we register it natively.
    const config = {
      path: 'derived_path',
      method: 'GET',
      level: EndpointSecurityLevel.PUBLIC
    };
    SecurityPolicy.validate(config);
    EndpointSecurityRegistry.register(config);
  };
}
