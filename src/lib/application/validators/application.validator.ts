import { ApplicationException } from '../exceptions/application.exception';

export class ApplicationValidator {
  static validateInput(input: any, requiredFields: string[]): void {
    if (!input || typeof input !== 'object') {
       throw ApplicationException.validation('Input must be a valid object');
    }
    const missing = requiredFields.filter(f => !(f in input));
    if (missing.length > 0) {
       throw ApplicationException.validation('Missing required input fields', { missing });
    }
  }
}
