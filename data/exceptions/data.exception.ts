export class DataException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataException';
  }

  static validation(message: string): DataException {
    return new DataException(`Data Validation Failed: ${message}`);
  }

  static failClosed(message: string): DataException {
    return new DataException(`Fail Closed Data Decision: ${message}`);
  }
}
