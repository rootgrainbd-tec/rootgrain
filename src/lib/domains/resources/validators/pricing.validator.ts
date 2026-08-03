import { Pricing } from '../types/pricing';
import { ValidationException } from '../exceptions/validation.exception';

export class PricingValidator {
  static validate(pricing: Partial<Pricing>): Pricing {
    const errors: Record<string, string[]> = {};

    if (typeof pricing.cost_price !== 'number' || pricing.cost_price < 0) {
      errors['cost_price'] = ['Must be a positive number'];
    }
    if (typeof pricing.selling_price !== 'number' || pricing.selling_price < 0) {
      errors['selling_price'] = ['Must be a positive number'];
    }
    if (!pricing.currency || pricing.currency.length !== 3) {
      errors['currency'] = ['Must be a valid 3-letter ISO currency code'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationException('Invalid pricing provided', errors);
    }

    // Return immutable copy
    return Object.freeze({ ...pricing }) as Pricing;
  }
}
