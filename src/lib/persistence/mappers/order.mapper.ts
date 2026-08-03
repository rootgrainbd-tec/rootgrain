import { SchemaValidator } from '../validators/schema.validator';

export class OrderMapper {
  static toPersistence(domainEntity: any): any {
    SchemaValidator.validateMapping(domainEntity, {}, 'Order');
    return Object.freeze({ ...domainEntity });
  }

  static toDomain(persistenceModel: any): any {
    SchemaValidator.validateMapping({}, persistenceModel, 'Order');
    return Object.freeze({ ...persistenceModel });
  }
}
