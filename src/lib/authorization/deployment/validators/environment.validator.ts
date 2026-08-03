export interface EnvironmentValidationResult {
  valid: boolean;
  errors: string[];
}

export class EnvironmentValidator {
  static validate(env: NodeJS.ProcessEnv): EnvironmentValidationResult {
    const errors: string[] = [];
    if (!env.NODE_ENV) {
      errors.push("NODE_ENV is required but missing");
    }
    return { valid: errors.length === 0, errors };
  }
}
