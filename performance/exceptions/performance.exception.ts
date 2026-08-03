export class PerformanceException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PerformanceException';
  }

  static validation(message: string): PerformanceException {
    return new PerformanceException(`Performance Validation Failed: ${message}`);
  }

  static failClosed(message: string): PerformanceException {
    return new PerformanceException(`Fail Closed Performance Decision: ${message}`);
  }
}
