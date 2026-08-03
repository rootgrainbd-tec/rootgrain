export class AuditException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuditException';
  }

  static validation(message: string): AuditException {
    return new AuditException(`Audit Validation Failed: ${message}`);
  }

  static failClosed(message: string): AuditException {
    return new AuditException(`Fail Closed Audit Decision: ${message}`);
  }
}
