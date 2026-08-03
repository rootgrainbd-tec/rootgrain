export class ProductionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductionException';
  }

  static validation(message: string): ProductionException {
    return new ProductionException(`Production Validation Failed: ${message}`);
  }

  static failClosed(message: string): ProductionException {
    return new ProductionException(`Fail Closed Production Decision: ${message}`);
  }
}
