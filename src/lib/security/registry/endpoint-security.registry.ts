export enum EndpointSecurityLevel {
  PUBLIC = 'PUBLIC',
  AUTHENTICATED = 'AUTHENTICATED',
  AUTHORIZED = 'AUTHORIZED'
}

export interface PermissionRequirement {
  resource: string;
  action: string;
}

export interface EndpointSecurityConfig {
  path: string;
  method: string;
  level: EndpointSecurityLevel;
  permissions?: PermissionRequirement[];
}

export class EndpointSecurityRegistry {
  private static configurations = new Map<string, EndpointSecurityConfig>();

  static register(config: EndpointSecurityConfig): void {
    const key = `${config.method}:${config.path}`;
    // Deep freeze configuration to prevent mutation
    this.configurations.set(key, Object.freeze({ ...config }));
  }

  static getConfiguration(method: string, path: string): EndpointSecurityConfig {
    const key = `${method}:${path}`;
    const config = this.configurations.get(key);
    if (!config) {
      // Default classification is AUTHORIZED per blueprint
      return Object.freeze({
        path,
        method,
        level: EndpointSecurityLevel.AUTHORIZED
      });
    }
    return config;
  }

  static getAll(): ReadonlyArray<EndpointSecurityConfig> {
    return Object.freeze(Array.from(this.configurations.values()));
  }
}
