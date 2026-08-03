import { RequestValidator } from '../../../lib/api/validators/request.validator';

export class AccountingEndpointValidator {
  static validateGeneratePayload(payload: any) {
    return RequestValidator.validatePayload(payload, ['order_id']);
  }
}
