export class IntegrationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegrationException';
  }

  static validation(message: string): IntegrationException {
    return new IntegrationException(`Integration Validation Failed: ${message}`);
  }

  static failClosed(message: string): IntegrationException {
    return new IntegrationException(`Fail Closed Integration Decision: ${message}`);
  }
}
