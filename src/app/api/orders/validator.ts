import { RequestValidator } from '../../../lib/api/validators/request.validator';

export class OrderEndpointValidator {
  static validateCreatePayload(payload: any) {
    return RequestValidator.validatePayload(payload, ['customer_id', 'items']);
  }
}
