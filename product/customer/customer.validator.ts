import { CustomerValue } from './customer.value';
import { OpportunityContract } from '../contracts/opportunity.contract';
import { ProductException } from '../exceptions/product.exception';

export class CustomerValidator {
  static validate(opportunity: OpportunityContract, value: CustomerValue): void {
      if (opportunity.validation_status !== 'VALIDATED') {
          throw ProductException.failClosed("Customer Validation Failed: Opportunity must be validated.");
      }
      if (!value.defined_metrics || value.defined_metrics.length === 0) {
          throw ProductException.failClosed("Customer Validation Failed: Customer value requires defined metrics.");
      }
  }
}
