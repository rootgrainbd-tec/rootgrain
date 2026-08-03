export class RollbackValidator {
  static validateTargetExists(applied: string[], target: string): boolean {
    if (!applied.includes(target)) {
      throw new Error(`Cannot rollback. Target migration ${target} was not applied.`);
    }
    return true;
  }

  static validateReverseOrder(applied: string[], rollbackStack: string[]): boolean {
    // Validates that rollbacks are executed in exact reverse order of application
    for(let i=0; i<rollbackStack.length; i++) {
        const expectedReverse = applied[applied.length - 1 - i];
        if (rollbackStack[i] !== expectedReverse) {
             throw new Error('Rollback order violation. Must be strictly reverse chronological.');
        }
    }
    return true;
  }
}
