export enum SeverityLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export class SeverityPolicy {
  static validate(level: SeverityLevel): boolean {
    return Object.values(SeverityLevel).includes(level);
  }
}
