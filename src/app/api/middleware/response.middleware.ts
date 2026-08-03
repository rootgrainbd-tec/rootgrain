import { ResponseValidator } from '../../../lib/api/validators/response.validator';
import { ApiResponse } from '../../../lib/api/contracts/response.contract';

export class ResponseMiddleware {
  static formatSuccess<T>(data: T, metadata: Record<string, unknown> | null = null): ApiResponse<T> {
    // Delegates directly to Phase 5.0's response validation logic
    return ResponseValidator.wrapSuccess(data, metadata);
  }
}
