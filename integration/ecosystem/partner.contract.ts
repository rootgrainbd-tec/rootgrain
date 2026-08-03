export type TrustLevel = 'INTERNAL' | 'VERIFIED' | 'LIMITED' | 'RESTRICTED';

export interface PartnerContract {
  readonly partner_id: string;
  readonly partner_type: string;
  readonly communication_scope: string;
  readonly trust_level: TrustLevel;
  readonly status: 'ACTIVE' | 'SUSPENDED';
}
