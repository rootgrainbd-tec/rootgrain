export class ConfigurationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationException';
  }

  static validation(message: string): ConfigurationException {
    return new ConfigurationException(`Configuration Validation Failed: ${message}`);
  }

  static failClosed(message: string): ConfigurationException {
    return new ConfigurationException(`Fail Closed Configuration Decision: ${message}`);
  }
}
