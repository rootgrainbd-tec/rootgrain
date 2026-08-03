import { RequestValidator } from '../../../lib/api/validators/request.validator';

export class ResourceEndpointValidator {
  static validateCreatePayload(payload: any) {
    return RequestValidator.validatePayload(payload, ['sku', 'slug', 'name', 'type', 'status']);
  }
}
