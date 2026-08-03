import { ProviderConfig, ProviderConfigValidator } from './provider.config';

export class InfrastructureConfig {
  private static configs = new Map<string, ProviderConfig>();

  static load(configs: ProviderConfig[]): void {
     for (const config of configs) {
       ProviderConfigValidator.validate(config);
       this.configs.set(config.id, Object.freeze(config));
     }
  }

  static get(id: string): ProviderConfig {
    const config = this.configs.get(id);
    if (!config) throw new Error(`Configuration for provider ${id} not found`);
    return config;
  }
}
