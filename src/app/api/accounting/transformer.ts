import { AccountingSerializer } from '../../../lib/api/serializers/accounting.serializer';
import { AccountingResponseDto } from '../../../lib/api/dto/accounting.dto';

export class AccountingTransformer {
  static transformOutput(domainEntity: any): AccountingResponseDto {
    return AccountingSerializer.serialize(domainEntity);
  }
}
