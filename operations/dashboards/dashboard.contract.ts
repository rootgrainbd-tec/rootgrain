export interface DashboardContract {
  readonly dashboard_id: string;
  readonly title: string;
  readonly panels: ReadonlyArray<string>;
}
