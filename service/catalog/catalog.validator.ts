import { ServiceRecord } from './service.record';
import { ServiceException } from '../exceptions/service.exception';

export class CatalogValidator {
  static validate(record: ServiceRecord): void {
     if (!record.service_id || !record.ownership) {
        throw ServiceException.validation("Service record missing core identifiers");
     }
  }
}
