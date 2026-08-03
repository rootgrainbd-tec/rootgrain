import { ReportingSerializer } from '../../../lib/api/serializers/reporting.serializer';
import { ReportingResponseDto } from '../../../lib/api/dto/reporting.dto';

export class ReportingTransformer {
  static transformOutput(domainEntity: any): ReportingResponseDto {
    return ReportingSerializer.serialize(domainEntity);
  }
}
