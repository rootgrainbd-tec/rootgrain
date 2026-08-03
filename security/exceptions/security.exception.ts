export class SecurityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityException';
  }

  static validation(message: string): SecurityException {
    return new SecurityException(`Security Validation Failed: ${message}`);
  }

  static compliance(message: string): SecurityException {
    return new SecurityException(`Compliance Check Failed: ${message}`);
  }
}
