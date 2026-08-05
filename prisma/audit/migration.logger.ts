export class MigrationLogger {
  static log(message: string): void {
    const timestamp = new Date().toISOString();
    // In a real environment, this goes to a file or stdout stream securely
    // console.log(`[MIGRATION] ${timestamp} - ${message}`);
  }

  static error(message: string, error: Error): void {
    const timestamp = new Date().toISOString();
    // console.error(`[MIGRATION-ERROR] ${timestamp} - ${message}`, error);
  }
}
