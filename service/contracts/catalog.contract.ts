export interface CatalogContract {
  readonly catalog_id: string;
  readonly service_id: string;
  readonly target_audience: string;
  readonly listed_status: 'LISTED' | 'UNLISTED';
}
