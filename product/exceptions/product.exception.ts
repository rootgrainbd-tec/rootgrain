export class ProductException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductException';
  }

  static validation(message: string): ProductException {
    return new ProductException(`Product Validation Failed: ${message}`);
  }

  static failClosed(message: string): ProductException {
    return new ProductException(`Fail Closed Product Decision: ${message}`);
  }
}
