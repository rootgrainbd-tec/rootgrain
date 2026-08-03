export class IdentityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityException';
  }

  static validation(message: string): IdentityException {
    return new IdentityException(`Identity Validation Failed: ${message}`);
  }

  static failClosed(message: string): IdentityException {
    return new IdentityException(`Fail Closed Identity Decision: ${message}`);
  }
}
