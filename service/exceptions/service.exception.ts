export class ServiceException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceException';
  }

  static validation(message: string): ServiceException {
    return new ServiceException(`Service Validation Failed: ${message}`);
  }

  static failClosed(message: string): ServiceException {
    return new ServiceException(`Fail Closed Service Decision: ${message}`);
  }
}
