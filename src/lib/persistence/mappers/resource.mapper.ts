import { SchemaValidator } from '../validators/schema.validator';

export class ResourceMapper {
  static toPersistence(domainEntity: any): any {
    SchemaValidator.validateMapping(domainEntity, {}, 'Resource');
    return Object.freeze({ ...domainEntity });
  }

  static toDomain(persistenceModel: any): any {
    SchemaValidator.validateMapping({}, persistenceModel, 'Resource');
    return Object.freeze({ ...persistenceModel });
  }
}
