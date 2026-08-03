export interface RolloutValidationResult {
  valid: boolean;
  errors: string[];
}

export class RolloutValidator {
  static validate(rolloutConfig: { active: boolean; percentage?: number }): RolloutValidationResult {
    const errors: string[] = [];
    if (rolloutConfig.percentage !== undefined && (rolloutConfig.percentage < 0 || rolloutConfig.percentage > 100)) {
      errors.push("Rollout percentage must be between 0 and 100");
    }
    return { valid: errors.length === 0, errors };
  }
}
