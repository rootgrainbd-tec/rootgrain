import { ReportingResponseDto } from '../dto/reporting.dto';

export class ReportingSerializer {
  static serialize(domainEntity: any): ReportingResponseDto {
    return Object.freeze({
      id: domainEntity.id,
      reference: domainEntity.reference,
      category: domainEntity.category,
      period: domainEntity.period
    });
  }
}
