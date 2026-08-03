import { EventException } from '../exceptions/event.exception';

export class PayloadValidator {
  static validate(payload: any, requiredFields: string[]): void {
    if (!payload || typeof payload !== 'object') {
       throw EventException.validation('Payload must be a valid object');
    }
    const missing = requiredFields.filter(f => !(f in payload));
    if (missing.length > 0) {
       throw EventException.validation('Payload missing required fields', { missing });
    }
  }
}
