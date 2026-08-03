export class MigrationValidator {
  static validateOrder(applied: string[], requiredDependencies: string[]): boolean {
    for (const dep of requiredDependencies) {
      if (!applied.includes(dep)) {
        throw new Error(`Missing migration dependency: ${dep}`);
      }
    }
    return true;
  }

  static validateSqlSafety(sqlContent: string): boolean {
    const uppercase = sqlContent.toUpperCase();
    if (uppercase.includes('DROP DATABASE')) {
       throw new Error('Unsafe SQL statement detected: DROP DATABASE');
    }
    return true;
  }
}
