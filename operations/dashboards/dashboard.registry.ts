import { DashboardContract } from './dashboard.contract';

export class DashboardRegistry {
  private static dashboards = new Map<string, DashboardContract>();

  static register(dashboard: DashboardContract): void {
     if (!dashboard.dashboard_id) throw new Error("Dashboard ID is required");
     this.dashboards.set(dashboard.dashboard_id, dashboard);
  }
}
