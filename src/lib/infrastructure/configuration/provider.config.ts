export interface ProviderConfig {
  readonly id: string;
  readonly type: string;
  readonly options: Readonly<Record<string, any>>;
}

export class ProviderConfigValidator {
  static validate(config: ProviderConfig): void {
     if (!config.id || !config.type) {
       throw new Error('Provider config must have id and type');
     }
     if (!Object.isFrozen(config.options)) {
       throw new Error('Provider config options must be strictly immutable');
     }
  }
}
