import { ExceptionHandler } from '../../../lib/api/exceptions/exception.handler';

export class ExceptionMiddleware {
  static handle(error: unknown): { statusCode: number, body: any } {
    // Catches routing and controller errors, delegates to Phase 5.0's ExceptionHandler
    return ExceptionHandler.handle(error);
  }
}
