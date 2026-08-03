export interface ReportSchema {
  readonly schema_id: string;
  readonly layout: string;
  readonly fields: ReadonlyArray<string>;
}
