import { SchemaValidator } from '../validators/schema.validator';

export class ProductionMapper {
  static toPersistence(domainEntity: any): any {
    SchemaValidator.validateMapping(domainEntity, {}, 'Production');
    return Object.freeze({ ...domainEntity });
  }

  static toDomain(persistenceModel: any): any {
    SchemaValidator.validateMapping({}, persistenceModel, 'Production');
    return Object.freeze({ ...persistenceModel });
  }
}
