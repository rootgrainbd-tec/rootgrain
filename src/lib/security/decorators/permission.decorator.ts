import { EndpointSecurityRegistry, EndpointSecurityLevel } from '../registry/endpoint-security.registry';
import { SecurityPolicy } from '../policies/security.policy';

export function Permission(resource: string, action: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const config = {
      path: 'derived_path',
      method: 'GET',
      level: EndpointSecurityLevel.AUTHORIZED,
      permissions: [{ resource, action }]
    };
    SecurityPolicy.validate(config);
    EndpointSecurityRegistry.register(config);
  };
}
