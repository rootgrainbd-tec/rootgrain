import { EndpointSecurityLevel, EndpointSecurityConfig } from '../registry/endpoint-security.registry';

export class EndpointPolicy {
  static getRequiredLevel(method: string, path: string): EndpointSecurityLevel {
    // Typically retrieves from EndpointSecurityRegistry
    return EndpointSecurityLevel.AUTHORIZED; // Fail-closed default
  }

  static matchesConfig(config: EndpointSecurityConfig, targetLevel: EndpointSecurityLevel): boolean {
    return config.level === targetLevel;
  }
}
