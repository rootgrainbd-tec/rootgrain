import { ApiException } from '../exceptions/api.exception';

export class RequestValidator {
  static validatePayload<T>(payload: unknown, requiredFields: string[]): T {
    if (!payload || typeof payload !== 'object') {
      throw ApiException.badRequest('Invalid request payload format');
    }

    const missing = requiredFields.filter(field => !(field in payload));
    
    if (missing.length > 0) {
      throw ApiException.badRequest('Missing required fields', missing.map(f => ({ field: f, issue: 'Required' })));
    }

    return Object.freeze({ ...payload }) as T;
  }
}
