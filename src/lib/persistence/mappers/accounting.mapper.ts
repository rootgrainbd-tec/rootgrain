import { SchemaValidator } from '../validators/schema.validator';

export class AccountingMapper {
  static toPersistence(domainEntity: any): any {
    SchemaValidator.validateMapping(domainEntity, {}, 'Accounting');
    return Object.freeze({ ...domainEntity });
  }

  static toDomain(persistenceModel: any): any {
    SchemaValidator.validateMapping({}, persistenceModel, 'Accounting');
    return Object.freeze({ ...persistenceModel });
  }
}
