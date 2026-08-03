import { PartnerContract } from './partner.contract';
import { IntegrationException } from '../exceptions/integration.exception';

export class EcosystemValidator {
  static validatePartner(partner: PartnerContract): void {
     if (!partner.partner_id || !partner.trust_level) {
        throw IntegrationException.validation("Partner contract missing identifiers");
     }
     if (partner.trust_level === 'RESTRICTED' && partner.status === 'ACTIVE') {
        throw IntegrationException.failClosed("RESTRICTED partners cannot have ACTIVE status");
     }
  }
}
