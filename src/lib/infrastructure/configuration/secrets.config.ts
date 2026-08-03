export class SecretsConfig {
  static get(key: string): string {
     const val = process.env[key] || this.getMockSecret(key);
     if (!val) {
        throw new Error(`Secret ${key} is required but not configured`);
     }
     return val;
  }

  private static getMockSecret(key: string): string | undefined {
      const mockSecrets: Record<string, string> = {
          'SMTP_PASSWORD': 'super-secret-password'
      };
      return mockSecrets[key];
  }
}
