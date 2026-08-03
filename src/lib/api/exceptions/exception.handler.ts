import { ApiException } from './api.exception';
import { ErrorContract } from '../contracts/error.contract';
import { HTTP_STATUS } from '../constants/api.constants';

export class ExceptionHandler {
  static handle(error: unknown): { statusCode: number; body: ErrorContract } {
    let statusCode: number = HTTP_STATUS.INTERNAL_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: any[] = [];

    if (error instanceof ApiException) {
      statusCode = error.statusCode;
      code = error.code;
      message = error.message;
      details = error.details;
    } else if (error instanceof Error) {
      message = error.message; // In a real system, you might sanitize this to not leak internal errors
    }

    const body: ErrorContract = {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    };

    return { statusCode, body: Object.freeze(body) };
  }
}
