import { AccountingResponseDto } from '../dto/accounting.dto';

export class AccountingSerializer {
  static serialize(domainEntity: any): AccountingResponseDto {
    return Object.freeze({
      id: domainEntity.id,
      invoice_number: domainEntity.invoice_number,
      order_id: domainEntity.order_id,
      status: domainEntity.status,
      total: domainEntity.total,
      outstanding_amount: domainEntity.outstanding_amount || 0
    });
  }
}
