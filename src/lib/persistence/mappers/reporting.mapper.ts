import { SchemaValidator } from '../validators/schema.validator';

export class ReportingMapper {
  static toPersistence(domainEntity: any): any {
    SchemaValidator.validateMapping(domainEntity, {}, 'Reporting');
    return Object.freeze({ ...domainEntity });
  }

  static toDomain(persistenceModel: any): any {
    SchemaValidator.validateMapping({}, persistenceModel, 'Reporting');
    return Object.freeze({ ...persistenceModel });
  }
}
