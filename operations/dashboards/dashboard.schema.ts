export interface DashboardSchema {
  readonly version: string;
  readonly layout: Readonly<Record<string, any>>;
}
