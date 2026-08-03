import { ApiResponse } from '../contracts/response.contract';

export class ResponseValidator {
  static wrapSuccess<T>(data: T, metadata: Record<string, unknown> | null = null): ApiResponse<T> {
    const response: ApiResponse<T> = {
      success: true,
      data,
      metadata,
      timestamp: new Date().toISOString()
    };
    return Object.freeze(response);
  }
}
