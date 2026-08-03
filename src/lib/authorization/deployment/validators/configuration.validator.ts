export interface ConfigurationValidationResult {
  valid: boolean;
  errors: string[];
}

export class ConfigurationValidator {
  static validate(config: Record<string, unknown>): ConfigurationValidationResult {
    const errors: string[] = [];
    if (typeof config.cacheEnabled !== 'boolean' && config.cacheEnabled !== undefined) {
      errors.push("cacheEnabled must be a boolean if provided");
    }
    return { valid: errors.length === 0, errors };
  }
}
