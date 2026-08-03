import { RequestValidator } from '../../../lib/api/validators/request.validator';

export class ProductionEndpointValidator {
  static validateStartPayload(payload: any) {
    return RequestValidator.validatePayload(payload, ['batch_id', 'inventory_id', 'target_quantity']);
  }
}
