export interface ApiVersion {
  readonly version_id: string;
  readonly major_version: number;
  readonly minor_version: number;
  readonly compatibility_status: 'COMPATIBLE' | 'BREAKING';
}
