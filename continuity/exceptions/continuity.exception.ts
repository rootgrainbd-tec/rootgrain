export class ContinuityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContinuityException';
  }

  static validation(message: string): ContinuityException {
    return new ContinuityException(`Continuity Validation Failed: ${message}`);
  }

  static failClosed(message: string): ContinuityException {
    return new ContinuityException(`Fail Closed Recovery Decision: ${message}`);
  }
}
