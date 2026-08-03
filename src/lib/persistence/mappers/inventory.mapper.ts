import { SchemaValidator } from '../validators/schema.validator';

export class InventoryMapper {
  static toPersistence(domainEntity: any): any {
    SchemaValidator.validateMapping(domainEntity, {}, 'Inventory');
    return Object.freeze({ ...domainEntity });
  }

  static toDomain(persistenceModel: any): any {
    SchemaValidator.validateMapping({}, persistenceModel, 'Inventory');
    return Object.freeze({ ...persistenceModel });
  }
}
