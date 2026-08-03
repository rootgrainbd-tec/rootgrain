import { ServiceContract } from '../contracts/service.contract';
import { CatalogContract } from '../contracts/catalog.contract';
import { SlaContract } from '../contracts/sla.contract';
import { ServiceException } from '../exceptions/service.exception';

export class ServiceRegistry {
  private static services = new Map<string, ServiceContract>();
  private static catalogs = new Map<string, CatalogContract>();
  private static slas = new Map<string, SlaContract>();

  static registerService(contract: ServiceContract): void {
     if (this.services.has(contract.service_id)) throw ServiceException.validation("Duplicate Service ID");
     this.services.set(contract.service_id, contract);
  }

  static registerCatalog(contract: CatalogContract): void {
     if (this.catalogs.has(contract.catalog_id)) throw ServiceException.validation("Duplicate Catalog ID");
     this.catalogs.set(contract.catalog_id, contract);
  }

  static registerSla(contract: SlaContract): void {
     if (this.slas.has(contract.sla_id)) throw ServiceException.validation("Duplicate SLA ID");
     this.slas.set(contract.sla_id, contract);
  }
}
