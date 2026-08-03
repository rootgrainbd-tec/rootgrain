import { ResourceResponseDto } from '../dto/resource.dto';

export class ResourceSerializer {
  static serialize(domainEntity: any): ResourceResponseDto {
    // Pure transformation, no side effects
    return Object.freeze({
      id: domainEntity.id,
      sku: domainEntity.sku,
      slug: domainEntity.slug,
      name: domainEntity.name,
      type: domainEntity.type,
      status: domainEntity.status
    });
  }
}
