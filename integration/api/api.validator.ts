import { ApiContract } from './api.contract';
import { IntegrationException } from '../exceptions/integration.exception';

export class ApiValidator {
  static validate(contract: ApiContract): void {
     if (!contract.api_id || !contract.version || !contract.lifecycle_status) {
        throw IntegrationException.validation("API contract missing essential identifiers");
     }
  }
}
