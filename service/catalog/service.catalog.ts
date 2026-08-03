import { ServiceRecord } from './service.record';
import { ServiceException } from '../exceptions/service.exception';

export class ServiceCatalog {
  private static records = new Map<string, ServiceRecord>();

  static register(record: ServiceRecord): void {
     if (this.records.has(record.service_id)) {
        throw ServiceException.validation("Duplicate Service Record ID in Catalog");
     }
     this.records.set(record.service_id, record);
  }
}
