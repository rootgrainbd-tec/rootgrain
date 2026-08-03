import { ApiErrorDetail } from '../contracts/error.contract';
import { HTTP_STATUS } from '../constants/api.constants';

export class ApiException extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details: ApiErrorDetail[] = []
  ) {
    super(message);
    this.name = 'ApiException';
  }

  static badRequest(message: string, details?: ApiErrorDetail[]): ApiException {
    return new ApiException(HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', message, details);
  }

  static notFound(message: string): ApiException {
    return new ApiException(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', message);
  }

  static internal(message: string = 'Internal Server Error'): ApiException {
    return new ApiException(HTTP_STATUS.INTERNAL_ERROR, 'INTERNAL_ERROR', message);
  }
}
