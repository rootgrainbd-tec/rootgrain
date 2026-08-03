import { ApiContract } from '../api/api.contract';
import { IntegrationException } from '../exceptions/integration.exception';

export class IntegrationValidator {
  static validate(contract: ApiContract): void {
     if (contract.lifecycle_status === 'RETIRED') {
        throw IntegrationException.failClosed("Retired APIs cannot be integrated");
     }
  }
}
