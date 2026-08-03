import { SeverityLevel } from '../policies/severity.policy';

export interface LoggerContract {
  log(level: SeverityLevel, message: string, context?: Record<string, any>): void;
}
