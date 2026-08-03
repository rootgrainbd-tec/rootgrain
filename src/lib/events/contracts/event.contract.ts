export interface DomainEventContract<T = any> {
  readonly id: string;
  readonly type: string;
  readonly aggregate_id: string;
  readonly aggregate_type: string;
  readonly payload: Readonly<T>;
  readonly metadata: Readonly<Record<string, any>>;
  readonly created_at: number;
}
