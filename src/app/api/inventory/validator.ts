import { RequestValidator } from '../../../lib/api/validators/request.validator';

export class InventoryEndpointValidator {
  static validateAdjustment(payload: any) {
    return RequestValidator.validatePayload(payload, ['resource_id', 'location_id', 'quantity_delta']);
  }
}
