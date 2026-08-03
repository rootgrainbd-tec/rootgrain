import { RequestValidator } from '../../../lib/api/validators/request.validator';

export class ReportingEndpointValidator {
  static validateGeneratePayload(payload: any) {
    return RequestValidator.validatePayload(payload, ['category', 'period']);
  }
}
