export type ProductLifecycleStatus = 'CONCEPT' | 'PLANNING' | 'DEVELOPMENT' | 'RELEASED' | 'MAINTENANCE' | 'RETIRED';

export interface ProductContract {
  readonly product_id: string;
  readonly product_name: string;
  readonly target_market: string;
  readonly ownership: string;
  readonly lifecycle_status: ProductLifecycleStatus;
  readonly version: string;
}
