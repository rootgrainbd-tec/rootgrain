import { ResourceSerializer } from '../../../lib/api/serializers/resource.serializer';
import { ResourceResponseDto } from '../../../lib/api/dto/resource.dto';

export class ResourceTransformer {
  static transformOutput(domainEntity: any): ResourceResponseDto {
    return ResourceSerializer.serialize(domainEntity);
  }
}
