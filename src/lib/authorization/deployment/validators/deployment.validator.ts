export interface DeploymentValidationResult {
  valid: boolean;
  errors: string[];
}

export class DeploymentValidator {
  static validate(): DeploymentValidationResult {
    return { valid: true, errors: [] };
  }
}
