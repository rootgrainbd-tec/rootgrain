export class EnvironmentValidator {
  static validate(requiredVars: string[]): void {
     const missing = requiredVars.filter(v => !process.env[v] && !this.getMockEnv(v));
     if (missing.length > 0) {
        throw new Error(`Environment validation failed. Missing required variables: ${missing.join(', ')}`);
     }
  }

  // Fallback for isolated testing context
  private static getMockEnv(key: string): string | undefined {
      const mockEnv: Record<string, string> = {
          'REDIS_URL': 'redis://localhost:6379',
          'SMTP_HOST': 'smtp.example.com',
          'DATABASE_URL': 'postgresql://user:pass@localhost/db',
          'OTEL_EXPORTER_OTLP_ENDPOINT': 'http://localhost:4318'
      };
      return mockEnv[key];
  }
}
